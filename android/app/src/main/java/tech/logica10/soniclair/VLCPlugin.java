package tech.logica10.soniclair;

import static androidx.core.content.ContextCompat.getSystemService;

import static tech.logica10.soniclair.SubsonicModels.*;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.PowerManager;

import com.bumptech.glide.Glide;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.json.JSONArray;
import org.json.JSONException;
import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import okhttp3.Credentials;
import okhttp3.FormBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

@CapacitorPlugin(name = "VLC")
public class VLCPlugin extends Plugin implements IBroadcastObserver {

    private static LibVLC mLibVLC = null;
    private static MediaPlayer mMediaPlayer = null;
    private static PowerManager.WakeLock wakeLock = null;
    private AudioManager.OnAudioFocusChangeListener audioFocusChangeListener = null;
    private AudioManager mAudioManager;
    private AudioAttributes mPlaybackAttributes;
    private SubsonicClient subsonicClient;
    private Gson gson;
    private MediaSession mediaSession;
    private Notification.Builder notificationBuilder;
    private Notification.MediaStyle mediaStyle;
    private MediaMetadata.Builder metadataBuilder;
    private NotificationManager notificationManager;
    private NotificationChannel channel;
    private List<Song> playlist;
    private Song currentTrack;
    private ExecutorService executorService;
    private String spotifyToken = "";
    private Boolean wasPlaying = false;

    private PlaybackState.Builder getPlaybackStateBuilder(){
        return new PlaybackState.Builder()
        .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS);
    }

    @Override
    public void load() {
        // Set up
        executorService = Executors.newFixedThreadPool(4);
        subsonicClient = new SubsonicClient(KeyValueStorage.Companion.getActiveAccount());
        playlist = new ArrayList<Song>();
        final ArrayList<String> args = new ArrayList<>();
        args.add("-vvv");
        GsonBuilder builder = new GsonBuilder();
        builder.serializeNulls();
        gson = builder.create();

        audioFocusChangeListener = new AudioManager.OnAudioFocusChangeListener() {
            @Override
            public void onAudioFocusChange(int focusChange) {
                switch (focusChange) {
                    case AudioManager.AUDIOFOCUS_GAIN:
                        // We just gained focus, or got it back.
                        // If we were playing something, and there's still something to play
                        // we resume playing that.
                        if (mMediaPlayer.getMedia() != null
                                && mMediaPlayer.getPosition() < mMediaPlayer.getMedia().getDuration() && wasPlaying) {
                            wasPlaying = false;
                            mMediaPlayer.play();
                            // Let the front end know
                            notifyListeners("play", null);
                            // Finally, we acquire the wakelock again
                            wakeLock.acquire(mMediaPlayer.getMedia().getDuration() * 1000);
                        }
                        break;
                    case AudioManager.AUDIOFOCUS_LOSS:
                    case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                    case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                        // We lost focus, let's pause playing
                        if (mMediaPlayer.isPlaying()) {
                            wasPlaying = true;
                            mMediaPlayer.pause();
                            // Let the front end know
                            notifyListeners("paused", null);
                        }
                        // Release the wakelock to keep the battery of the user from
                        // dying too young.
                        if (wakeLock.isHeld()) {
                            wakeLock.release();

                        }
                        break;
                }
            }
        };

        // initialization of the audio attributes and focus request
        mAudioManager = (AudioManager) MainActivity.context.getSystemService(Context.AUDIO_SERVICE);

        mPlaybackAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();

        AudioFocusRequest mFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(mPlaybackAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(audioFocusChangeListener)
                .build();
        final Object mFocusLock = new Object();

        // requesting audio focus
        int res = mAudioManager.requestAudioFocus(mFocusRequest);
        synchronized (mFocusLock) {
            if (res == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
                // What are you gonna do about it?
                if (mMediaPlayer != null && mMediaPlayer.isPlaying()) {
                    mMediaPlayer.pause();
                    wasPlaying = true;
                    // Let the front end know
                    notifyListeners("paused", null);
                }
            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                // We don't do anything here, let's wait for the user to start playing music

            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_DELAYED) {
                // We don't do anything here, let's wait for the user to start playing music.
            }
        }

        if (mLibVLC == null) {
            mLibVLC = new LibVLC(MainActivity.context, args);
            mMediaPlayer = new MediaPlayer(mLibVLC);
            mMediaPlayer.setEventListener(new MediaPlayer.EventListener() {
                @Override
                public void onEvent(MediaPlayer.Event event) {
                    if (event.type == MediaPlayer.Event.TimeChanged) {
                        float position = mMediaPlayer.getPosition();
                        JSObject ret = new JSObject();
                        ret.put("time", position);
                        notifyListeners("progress", ret);
                    } else if (event.type == MediaPlayer.Event.EndReached) {
                        notifyListeners("stopped", null);
                        try {
                            _next();
                        } catch (JSONException e) {
                            e.printStackTrace();
                        } catch (ExecutionException e) {
                            e.printStackTrace();
                        } catch (InterruptedException e) {
                            e.printStackTrace();
                        }
                    } else if (event.type == MediaPlayer.Event.Paused || event.type == MediaPlayer.Event.Stopped) {
                        notifyListeners("paused", null);
                    } else if (event.type == MediaPlayer.Event.Playing) {
                        notifyListeners("play", null);
                    }
                }
            });
        }

        // Acquire wakelock to stop Android from shutting us down
        PowerManager powerManager = (PowerManager) MainActivity.context.getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,
                "SonicLair::VLCWakeLock");

        // ************* MEDIA SESSION ************
        // Create a media session. NotificationCompat.MediaStyle
        // PlayerService is your own Service or Activity responsible for media playback.
        mediaSession = Globals.GetMediaSession();

        PlaybackState.Builder b = getPlaybackStateBuilder().setState(PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 0);
        mediaSession.setPlaybackState(b.build());

        notificationBuilder = new Notification.Builder(MainActivity.context, "soniclairr");
        // Create a Notification which is styled by your MediaStyle object.
        // This connects your media session to the media controls.
        // Don't forget to include a small icon.
        mediaStyle = new Notification.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(1);

        // Specify any actions which your users can perform, such as pausing and skipping to the next track.

        metadataBuilder = new MediaMetadata.Builder();

        notificationManager = getSystemService(MainActivity.context, NotificationManager.class);

        channel = new NotificationChannel(
                "soniclair",
                "Soniclair",
                NotificationManager.IMPORTANCE_MIN);
        notificationManager.createNotificationChannel(channel);


        // ********* PREV ********
        //This is the intent of PendingIntent
        Intent prevIntent = new Intent(MainActivity.context, NotificationBroadcastReceiver.class);
        prevIntent.setAction("SLPREV");
        PendingIntent pendingPrevIntent = PendingIntent.getBroadcast(MainActivity.context, 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        Notification.Action.Builder actionBuilder = new Notification.Action.Builder(android.R.drawable.ic_media_previous, "PREV", pendingPrevIntent);
        Notification.Action prevAction = actionBuilder.build();
        notificationBuilder.addAction(prevAction);

        // ********* PAUSE ********
        //This is the intent of PendingIntent
        Intent pauseIntent = new Intent(MainActivity.context, NotificationBroadcastReceiver.class);
        pauseIntent.setAction("SLPAUSE");
        PendingIntent pendingPauseIntent = PendingIntent.getBroadcast(MainActivity.context, 1, pauseIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        actionBuilder = new Notification.Action.Builder(android.R.drawable.ic_media_pause, "PAUSE", pendingPauseIntent);
        Notification.Action pauseAction = actionBuilder.build();
        notificationBuilder.addAction(pauseAction);

        // ********* NEXT ********
        //This is the intent of PendingIntent
        Intent nextIntent = new Intent(MainActivity.context, NotificationBroadcastReceiver.class);
        nextIntent.setAction("SLNEXT");
        PendingIntent pendingNextIntent = PendingIntent.getBroadcast(MainActivity.context, 1, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        actionBuilder = new Notification.Action.Builder(android.R.drawable.ic_media_next, "NEXT", pendingNextIntent);
        Notification.Action nextAction = actionBuilder.build();
        notificationBuilder.addAction(nextAction);
        Globals.RegisterObserver(this);

    }

    private JSObject ErrorResponse(String error) {
        JSObject ret = new JSObject();
        ret.put("status", "error");
        ret.put("error", error);
        ret.put("value", null);
        return ret;
    }

    private JSObject OkResponse(Object value) throws JSONException {
        JSObject ret = new JSObject();
        ret.put("status", "ok");
        ret.put("error", null);
        String valueJson = gson.toJson(value);
        ret.put("value", new JSObject(valueJson));
        return ret;
    }

    private JSObject OkArrayResponse(Object value) throws JSONException {
        JSObject ret = new JSObject();
        ret.put("status", "ok");
        ret.put("error", null);
        String array = gson.toJson(value);
        JSONArray jsonarray = new JSONArray(array);
        ret.put("value", jsonarray);
        return ret;
    }

    private JSObject OkStringResponse(String value) {
        JSObject ret = new JSObject();
        ret.put("status", "ok");
        ret.put("error", null);
        ret.put("value", value);
        return ret;
    }

    @PluginMethod()
    public void login(PluginCall call) {
        JSObject data = call.getData();
        String username = data.getString("username");
        String password = data.getString("password");
        String url = data.getString("url");
        try {
            Account account = subsonicClient.login(username, password, url);
            KeyValueStorage.Companion.setActiveAccount(account);
            call.resolve(OkResponse(account));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getTopAlbums(PluginCall call) throws JSONException {
        try {

            call.resolve(OkArrayResponse(subsonicClient.getTopAlbums()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getAlbums(PluginCall call) throws JSONException {
        try {
            call.resolve(OkArrayResponse(subsonicClient.getAlbums()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getAlbum(PluginCall call) throws JSONException {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.resolve(ErrorResponse("Missing required parameter id"));
                return;
            }
            call.resolve(OkResponse(subsonicClient.getAlbum(id)));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getArtists(PluginCall call) throws JSONException {
        try {
            call.resolve(OkResponse(subsonicClient.getArtists()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getArtist(PluginCall call) throws JSONException {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.resolve(ErrorResponse("Missing required parameter id"));
                return;
            }
            call.resolve(OkResponse(subsonicClient.getArtist(id)));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getArtistInfo(PluginCall call) throws JSONException {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.resolve(ErrorResponse("Missing required parameter id"));
                return;
            }
            call.resolve(OkResponse(subsonicClient.getArtistInfo(id)));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }


    @PluginMethod()
    public void getRandomSongs(PluginCall call) throws JSONException {
        try {
            call.resolve(OkArrayResponse(subsonicClient.getRandomSongs()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getActiveAccount(PluginCall call) throws JSONException {
        try {
            call.resolve(OkResponse(KeyValueStorage.Companion.getActiveAccount()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getAlbumArt(PluginCall call) {
        try {
            call.resolve(OkStringResponse(subsonicClient.getAlbumArt(call.getString("id"))));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void play(PluginCall call) {
        String value = call.getString("uri");
        if (value != null) {
            final Media media = new Media(mLibVLC, Uri.parse(value));
            mMediaPlayer.setMedia(media);
        }
        if (mMediaPlayer.getMedia() != null) {
            mMediaPlayer.play();
            wakeLock.acquire(mMediaPlayer.getMedia().getDuration() * 1000);
        }
        AudioFocusRequest mFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(mPlaybackAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(audioFocusChangeListener)
                .build();
        final Object mFocusLock = new Object();

        // requesting audio focus
        int res = mAudioManager.requestAudioFocus(mFocusRequest);
        synchronized (mFocusLock) {
            if (res == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
                // What are you gonna do about it?
                if (mMediaPlayer.isPlaying()) {
                    mMediaPlayer.pause();
                    // Let the front end know
                    notifyListeners("paused", null);
                }
            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                // We don't do anything here, let's wait for the user to start playing music

            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_DELAYED) {
                // We don't do anything here, let's wait for the user to start playing music.
            }
        }
        call.resolve(OkStringResponse(""));
    }

    private void _pause() {
        if (mMediaPlayer.isPlaying()) {
            mMediaPlayer.pause();
            if (wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
        PlaybackState.Builder b = getPlaybackStateBuilder().setState(PlaybackState.STATE_PAUSED, (long) mMediaPlayer.getPosition() * currentTrack.getDuration(), 0);
        mediaSession.setPlaybackState(b.build());
        mediaSession.setActive(true);
    }

    @PluginMethod()
    public void pause(PluginCall call) {
        _pause();
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void seek(PluginCall call) {
        JSObject ret = new JSObject();
        float value = call.getFloat("time");
        mMediaPlayer.setPosition(value);
        call.resolve(OkStringResponse(""));

    }

    @PluginMethod()
    public void setVolume(PluginCall call) {
        JSObject ret = new JSObject();
        int value = call.getInt("volume", 100);
        mMediaPlayer.setVolume(value);
        call.resolve(OkStringResponse(""));

    }

    private void _playRadio(String id) throws Exception {
        playlist = subsonicClient.getSimilarSongs(id);
        playlist.add(0, subsonicClient.getSong(id));
        if (playlist.size() == 1) {
            throw new Exception("The server did not report similar songs to this one.");
        }
        currentTrack = playlist.get(0);
        _loadMedia();
        _play();
    }

    private void _loadMedia(){
        String uri = subsonicClient.getSongUri(currentTrack);
        if (uri != null) {
            final Media media = new Media(mLibVLC, Uri.parse(uri));
            if(mMediaPlayer.isPlaying())
                mMediaPlayer.pause();
            mMediaPlayer.setMedia(media);
            media.release();
        }
    }

    @PluginMethod()
    public void playRadio(PluginCall call) throws ExecutionException, InterruptedException, JSONException {
        String id = call.getString("song");
        try {
            _playRadio(id);
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void playAlbum(PluginCall call) throws ExecutionException, InterruptedException, JSONException {
        String id = call.getString("album");
        Integer track = call.getInt("track");
        try {
            playlist = subsonicClient.getAlbum(id).getSong();
            currentTrack = playlist.get(track);
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
       _loadMedia();
        _play();
        call.resolve(OkStringResponse(""));
    }

    private void _next() throws JSONException, ExecutionException, InterruptedException {
        if (playlist.indexOf(currentTrack) < playlist.size() - 1) {
            currentTrack = playlist.get(playlist.indexOf(currentTrack) + 1);
            _loadMedia();
            _play();
        }

    }

    @PluginMethod()
    public void next(PluginCall call) throws JSONException, ExecutionException, InterruptedException {
        _next();
        call.resolve(OkStringResponse(""));

    }

    private void _prev() throws JSONException, ExecutionException, InterruptedException {
        if (playlist.indexOf(currentTrack) > 0) {
            currentTrack = playlist.get(playlist.indexOf(currentTrack) - 1);
            _loadMedia();
            _play();
        }

    }

    @PluginMethod()
    public void getSpotifyToken(PluginCall call) throws IOException, JSONException {
        if (Objects.equals(spotifyToken, "")) {
            String client_id = "3cb3ecad8ce14e1dba560e3b5ceb908b";
            String client_secret = "86810d6f234142a9bf7be9d2a924bbba";
            Uri.Builder uriBuilder = new Uri.Builder()
                    .scheme("https")
                    .authority("accounts.spotify.com")
                    .appendPath("api")
                    .appendPath("token");
            RequestBody body = new FormBody.Builder()
                    .add("grant_type", "client_credentials")
                    .build();

            Request request = new Request.Builder()
                    .url(uriBuilder.build().toString())
                    .addHeader("Accept", "application/json")
                    .addHeader("Content-Type", "application/x-www-form-urlencoded")
                    .addHeader(
                            "Authorization",
                            Credentials.basic(client_id, client_secret))
                    .post(body)
                    .build();
            OkHttpClient client = new OkHttpClient.Builder()
                    .readTimeout(5000, TimeUnit.MILLISECONDS)
                    .writeTimeout(5000, TimeUnit.MILLISECONDS)
                    .build();


            Response response = client.newCall(request).execute();
            if (response.isSuccessful()) {
                spotifyToken = new JSObject(response.body().string()).getString("access_token");
            }

        }
        call.resolve(OkStringResponse(spotifyToken));
    }

    @PluginMethod()
    public void search(PluginCall call){
        String query = call.getString("query");
        try {
            SearchResult result = subsonicClient.search(query);
            JSObject ret = OkResponse(result);
            call.resolve(ret);
            return;
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void prev(PluginCall call) throws JSONException, ExecutionException, InterruptedException {
        _prev();
        call.resolve(OkStringResponse(""));
    }

    private void _play() throws ExecutionException, InterruptedException, JSONException {
        wasPlaying = false;
        if (mMediaPlayer.getMedia() != null) {
            mMediaPlayer.play();
            wakeLock.acquire(currentTrack.getDuration() * 1000);
        }
        AudioFocusRequest mFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(mPlaybackAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(audioFocusChangeListener)
                .build();
        final Object mFocusLock = new Object();

        // requesting audio focus
        int res = mAudioManager.requestAudioFocus(mFocusRequest);
        synchronized (mFocusLock) {
            if (res == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
                // What are you gonna do about it?
                if (mMediaPlayer.isPlaying()) {
                    mMediaPlayer.pause();
                    // Let the front end know
                    notifyListeners("paused", null);
                }
            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                // We don't do anything here, let's wait for the user to start playing music

            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_DELAYED) {
                // We don't do anything here, let's wait for the user to start playing music.
            }
        }
        notifyListeners("play", null);
        String ct = String.format("{currentTrack: %s}", gson.toJson(currentTrack));

        PlaybackState.Builder b = getPlaybackStateBuilder().setState(PlaybackState.STATE_PLAYING, (long) mMediaPlayer.getPosition() * currentTrack.getDuration(), 1);
        mediaSession.setPlaybackState(b.build());
        mediaSession.setActive(true);

        notifyListeners("currentTrack", new JSObject(ct));
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM, subsonicClient.getAlbumArt(currentTrack.getAlbumId()));
                Uri albumArtUri = Uri.parse(subsonicClient.getAlbumArt(currentTrack.getAlbumId()));
                Bitmap albumArtBitmap = null;
                try {
                    albumArtBitmap = Glide.with(MainActivity.context)
                            .asBitmap()
                            .load(albumArtUri)
                            .submit()
                            .get();
                } catch (ExecutionException e) {
                    e.printStackTrace();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                metadataBuilder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, albumArtBitmap);
                metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST, currentTrack.getArtist());
                metadataBuilder.putString(MediaMetadata.METADATA_KEY_ARTIST, currentTrack.getArtist());
                metadataBuilder.putString(MediaMetadata.METADATA_KEY_TITLE, currentTrack.getTitle());
                mediaSession.setMetadata(metadataBuilder.build());
                notificationBuilder.setSmallIcon(R.drawable.ic_stat_soniclair);
                notificationBuilder.setLargeIcon(albumArtBitmap);
                notificationBuilder.setContentTitle(currentTrack.getTitle());
                notificationBuilder.setContentText(currentTrack.getAlbum());
                notificationBuilder.setStyle(mediaStyle);
                notificationBuilder.setChannelId("soniclair");
                notificationManager.notify("SonicLair", 1, notificationBuilder.build());
            }
        });
    }

    @Override
    public void update(String action, String value) {
        try {
            if (action.startsWith("SL")) {
                switch (action) {
                    case "SLPLAY":
                    case "SLPAUSE":
                        if (mMediaPlayer.isPlaying()) {
                            _pause();
                        } else {
                            _play();
                        }
                        break;
                    case "SLPREV":
                        _prev();
                        break;
                    case "SLNEXT":
                        _next();
                        break;
                    case "SLPLAYID":
                        executorService.execute(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    _playRadio(value);
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }

                            }
                        });
                }
            }
        } catch (Exception e) {
            // Frankly my dear, I couldn't care less.
        }


    }
}


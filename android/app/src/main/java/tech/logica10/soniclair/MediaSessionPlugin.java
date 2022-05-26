package tech.logica10.soniclair;

import static androidx.core.content.ContextCompat.getSystemService;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.FutureTarget;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;
import java.util.concurrent.ExecutionException;

@CapacitorPlugin(name = "MediaSession")
public class MediaSessionPlugin extends Plugin implements IBroadcastObserver {

    private MediaSession mediaSession;
    private Notification.Style mediaStyle;
    private NotificationManager notificationManager;
    private Notification.Builder notificationBuilder;
    private MediaMetadata.Builder metadataBuilder;
    private PlaybackState.Builder stateBuilder;
    private NotificationChannel channel;

    @Override
    public void load() {
        // Create a media session. NotificationCompat.MediaStyle
        // PlayerService is your own Service or Activity responsible for media playback.
        mediaSession = new MediaSession(MainActivity.context, "Soniclair");
        mediaSession.setCallback(new SonicLairSessionCallbacks());

        notificationBuilder = new Notification.Builder(MainActivity.context, "soniclairr");
        // Create a Notification which is styled by your MediaStyle object.
        // This connects your media session to the media controls.
        // Don't forget to include a small icon.
        mediaStyle = new Notification.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(1);

        // Specify any actions which your users can perform, such as pausing and skipping to the next track.

        metadataBuilder = new MediaMetadata.Builder();

        notificationManager = (NotificationManager) getSystemService(MainActivity.context, NotificationManager.class);
        stateBuilder = new PlaybackState.Builder();

        channel = new NotificationChannel(
                "soniclair",
                "Soniclair",
                NotificationManager.IMPORTANCE_MIN);
        notificationManager.createNotificationChannel(channel);


        // ********* PREV ********
        //This is the intent of PendingIntent
        Intent prevIntent = new Intent(MainActivity.context, NotificationBroadcastReceiver.class);
        prevIntent.setAction("SLPREV");
        PendingIntent pendingPrevIntent = PendingIntent.getBroadcast(MainActivity.context, 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        Notification.Action.Builder builder = new Notification.Action.Builder(android.R.drawable.ic_media_previous, "PREV", pendingPrevIntent);
        Notification.Action prevAction = builder.build();
        notificationBuilder.addAction(prevAction);

        // ********* PAUSE ********
        //This is the intent of PendingIntent
        Intent pauseIntent = new Intent(MainActivity.context, NotificationBroadcastReceiver.class);
        pauseIntent.setAction("SLPAUSE");
        PendingIntent pendingPauseIntent = PendingIntent.getBroadcast(MainActivity.context, 1, pauseIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        builder = new Notification.Action.Builder(android.R.drawable.ic_media_pause, "PAUSE", pendingPauseIntent);
        Notification.Action pauseAction = builder.build();
        notificationBuilder.addAction(pauseAction);

        // ********* NEXT ********
        //This is the intent of PendingIntent
        Intent nextIntent = new Intent(MainActivity.context, NotificationBroadcastReceiver.class);
        nextIntent.setAction("SLNEXT");
        PendingIntent pendingNextIntent = PendingIntent.getBroadcast(MainActivity.context, 1, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        builder = new Notification.Action.Builder(android.R.drawable.ic_media_next, "NEXT", pendingNextIntent);
        Notification.Action nextAction = builder.build();
        notificationBuilder.addAction(nextAction);
        Globals.RegisterObserver(this);
    }

    @PluginMethod()
    public void play(PluginCall call) {
        stateBuilder.setState(PlaybackState.STATE_PLAYING, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1);
        mediaSession.setPlaybackState(stateBuilder.build());
        mediaSession.setActive(true);
        call.resolve();
    }

    @PluginMethod()
    public void pause(PluginCall call) {
        stateBuilder.setState(PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1);
        mediaSession.setPlaybackState(stateBuilder.build());
        mediaSession.setActive(true);
        call.resolve();
    }

    @PluginMethod()
    public void updateMedia(PluginCall call) throws ExecutionException, InterruptedException {
        JSObject ret = new JSObject();
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM, call.getString("album"));
        Uri albumArtUri = Uri.parse(call.getString("albumImage"));
        FutureTarget<Bitmap> futureBitmap = Glide.with(MainActivity.context)
                .asBitmap()
                .load(albumArtUri)
                .submit();
        Bitmap albumArtBitmap = futureBitmap.get();
        metadataBuilder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART,albumArtBitmap);
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST, call.getString("artist"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ARTIST, call.getString("artist"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_TITLE, call.getString("song"));
        mediaSession.setMetadata(metadataBuilder.build());
        notificationBuilder.setSmallIcon(R.drawable.ic_stat_soniclair);
        notificationBuilder.setLargeIcon(albumArtBitmap);
        notificationBuilder.setContentTitle(call.getString("song"));
        notificationBuilder.setContentText(call.getString("album"));
        notificationBuilder.setStyle(mediaStyle);
        notificationBuilder.setChannelId("soniclair");
        notificationManager.notify("SonicLair", 1, notificationBuilder.build());
        ret.put("status", "ok");
        call.resolve(ret);
    }

    @Override
    public void update(String action) {
        if (action.startsWith("SL")) {
            notifyListeners(action.replace("SL", "").toLowerCase(Locale.ROOT), null);
        }
    }





}

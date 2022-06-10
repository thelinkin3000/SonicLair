package tech.logica10.soniclair

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
import android.graphics.Bitmap
import android.media.*
import android.media.AudioManager.OnAudioFocusChangeListener
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.bumptech.glide.Glide
import com.getcapacitor.JSObject
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONException
import org.videolan.libvlc.LibVLC
import org.videolan.libvlc.Media
import org.videolan.libvlc.MediaPlayer
import tech.logica10.soniclair.KeyValueStorage.Companion.getActiveAccount
import tech.logica10.soniclair.SubsonicModels.Song
import java.io.File
import java.io.IOException
import java.io.RandomAccessFile
import java.nio.channels.FileChannel
import java.nio.channels.FileLock
import java.nio.channels.OverlappingFileLockException
import java.util.concurrent.ExecutionException

class MusicService : Service(), IBroadcastObserver, MediaPlayer.EventListener {
    private var wasPlaying: Boolean = false
    val args = mutableListOf("-vvv")
    private var mLibVLC: LibVLC? = null
    private var currentTrack: Song? = null
    private val mAudioManager: AudioManager =
        App.context.getSystemService(AUDIO_SERVICE) as AudioManager
    private val mPlaybackAttributes: AudioAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build()
    private val subsonicClient: SubsonicClient = SubsonicClient(getActiveAccount())
    private val gson: Gson = GsonBuilder().serializeNulls().create()
    private val mediaSession: MediaSessionCompat = Globals.GetMediaSession()
    private val mediaStyle: androidx.media.app.NotificationCompat.MediaStyle = androidx.media.app.NotificationCompat.MediaStyle()
        .setMediaSession(mediaSession.sessionToken)
        .setShowActionsInCompactView(1, 2)
    private val notificationBuilder: NotificationCompat.Builder =
        NotificationCompat.Builder(App.context, "soniclair")
            .setSmallIcon(R.drawable.ic_stat_soniclair)
            .setStyle(mediaStyle)
            .setChannelId("soniclair")
    private val metadataBuilder: MediaMetadataCompat.Builder = MediaMetadataCompat.Builder()
    private val notificationManager: NotificationManagerCompat =
        NotificationManagerCompat.from(App.context)
    private val channel: NotificationChannelCompat = NotificationChannelCompat
        .Builder("soniclair",NotificationManagerCompat.IMPORTANCE_LOW)
        .setName("SonicLair")
        .setDescription("Currently playing notification")
        .build()
    private var playlist: MutableList<Song> = mutableListOf()
    private var prevAction: NotificationCompat.Action? = null
    private var pauseAction: NotificationCompat.Action? = null
    private var playAction: NotificationCompat.Action? = null
    private var nextAction: NotificationCompat.Action? = null
    private var cancelAction: NotificationCompat.Action? = null
    private var isForeground: Boolean = false
    private val binder = LocalBinder()
    private val NOTIF_ID = 1;
    val connectivityManager = App.context.getSystemService(ConnectivityManager::class.java)



    private var mMediaPlayer: MediaPlayer? = null

    inner class DeviceCallback: AudioDeviceCallback(){
        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
            this@MusicService._pause()
        }
    }

    init {
        Globals.RegisterObserver(this)
        mAudioManager.registerAudioDeviceCallback(DeviceCallback(), null)
    }

    private fun updateNotification(albumArtBitmap: Bitmap?, play: Boolean = false) {
        if (albumArtBitmap != null) {
            notificationBuilder.setLargeIcon(albumArtBitmap)
        }
        val intent = Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        notificationBuilder.setContentIntent(PendingIntent.getActivity(this, 0, intent, flags))
        notificationBuilder.setContentTitle(currentTrack!!.title)
        notificationBuilder.setContentText(currentTrack!!.album)
        notificationBuilder.setChannelId("soniclair")
        notificationBuilder.clearActions()
        notificationBuilder.addAction(prevAction)
        notificationBuilder.addAction(if(play) playAction else pauseAction)
        notificationBuilder.addAction(nextAction)
        notificationBuilder.addAction(cancelAction)
        notificationBuilder.setOngoing(true)

        val notif = notificationBuilder.build();
        if (!isForeground) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIF_ID, notif,
                    FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                )
            } else {
                startForeground(NOTIF_ID, notif)
            }
            isForeground = true
        }
        notificationManager.notify(NOTIF_ID,notif)
    }

    fun updateMediaSession(playbackState: PlaybackStateCompat) {
        mediaSession.setPlaybackState(playbackState)
        mediaSession.isActive = true
    }

    fun updateMediaMetadata(albumArtBitmap: Bitmap?) {
        metadataBuilder.putBitmap(
            MediaMetadata.METADATA_KEY_ALBUM_ART,
            albumArtBitmap
        )
        metadataBuilder.putString(
            MediaMetadata.METADATA_KEY_ALBUM_ARTIST,
            currentTrack!!.artist
        )
        metadataBuilder.putString(
            MediaMetadata.METADATA_KEY_ARTIST,
            currentTrack!!.artist
        )
        metadataBuilder.putString(
            MediaMetadata.METADATA_KEY_TITLE,
            currentTrack!!.title
        )
        mediaSession.setMetadata(metadataBuilder.build())
    }

    override fun onCreate() {
        super.onCreate()
        Log.i("ServiceCreation","Created")
        notificationManager.createNotificationChannel(channel)
        try {
            mLibVLC = LibVLC(MainActivity.context, args)
            mMediaPlayer = MediaPlayer(mLibVLC)
        } catch (e: Exception) {
            Log.i("Soniclair", e.message!!)
        }


        mMediaPlayer!!.setEventListener(this)
        // ********* PREV ********
        //This is the intent of PendingIntent
        val prevIntent = Intent(App.context, NotificationBroadcastReceiver::class.java)
        prevIntent.action = "SLPREV"
        val pendingPrevIntent = PendingIntent.getBroadcast(
            App.context,
            1,
            prevIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        var actionBuilder =
            NotificationCompat.Action.Builder(R.drawable.ic_skip_previous, "PREV", pendingPrevIntent)
        prevAction = actionBuilder.build()

        // ********* PLAYPAUSE ********
        //This is the intent of PendingIntent
        val pauseIntent = Intent(App.context, NotificationBroadcastReceiver::class.java)
        pauseIntent.action = "SLPAUSE"
        val pendingPauseIntent = PendingIntent.getBroadcast(
            App.context,
            1,
            pauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        actionBuilder =
            NotificationCompat.Action.Builder(R.drawable.ic_pause, "PAUSE", pendingPauseIntent)
        pauseAction = actionBuilder.build()
        actionBuilder =
            NotificationCompat.Action.Builder(R.drawable.ic_play_arrow, "PLAY", pendingPauseIntent)
        playAction = actionBuilder.build()

        // ********* NEXT ********
        //This is the intent of PendingIntent
        val nextIntent = Intent(App.context, NotificationBroadcastReceiver::class.java)
        nextIntent.action = "SLNEXT"
        val pendingNextIntent = PendingIntent.getBroadcast(
            App.context,
            1,
            nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        actionBuilder =
            NotificationCompat.Action.Builder(R.drawable.ic_skip_next, "NEXT", pendingNextIntent)
        nextAction = actionBuilder.build()

        val cancelIntent = Intent(App.context, NotificationBroadcastReceiver::class.java)
        cancelIntent.action = "SLCANCEL"
        val pendingCancelIntent = PendingIntent.getBroadcast(
            App.context,
            1,
            cancelIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        actionBuilder =
            NotificationCompat.Action.Builder(R.drawable.ic_action_cancel, "CANCEL", pendingCancelIntent)
        cancelAction = actionBuilder.build()

        notificationBuilder.setStyle(mediaStyle)
    }

    private fun getPlaybackStateBuilder(): PlaybackStateCompat.Builder {
        return PlaybackStateCompat.Builder()
            .setActions(PlaybackStateCompat.ACTION_PLAY
                    or PlaybackStateCompat.ACTION_PAUSE
                    or PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                    or PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS)
    }


    private val audioFocusChangeListener = OnAudioFocusChangeListener { focusChange: Int ->
        when (focusChange) {
            AudioManager.AUDIOFOCUS_GAIN ->
                // We just gained focus, or got it back.
                // If we were playing something, and there's still something to play
                // we resume playing that.
                if (mMediaPlayer!!.media != null && mMediaPlayer!!.position < mMediaPlayer!!.media!!
                        .duration && wasPlaying
                ) {
                    wasPlaying = false
                    mMediaPlayer!!.play()
                }
            AudioManager.AUDIOFOCUS_LOSS, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                // We lost focus, let's pause playing
                if (mMediaPlayer!!.isPlaying) {
                    wasPlaying = true
                    mMediaPlayer!!.pause()
                }
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action != null) {
            CoroutineScope(Dispatchers.IO).launch {
                when (intent.action) {
                    Constants.SERVICE_PLAY_PAUSE -> if (mMediaPlayer!!.isPlaying) _pause() else _play()
                    Constants.SERVICE_NEXT -> next()
                    Constants.SERVICE_PREV -> prev()
                    Constants.SERVICE_PLAY_ALBUM -> {
                        val id = intent.extras?.getString("id")
                        val track = intent.extras?.getInt("track")
                        if (id != null && track != null) {
                            _playAlbum(id, track)
                        }
                    }
                    Constants.SERVICE_PLAY_RADIO -> {
                        val id = intent.extras?.getString("id")
                        if (id != null) {
                            _playRadio(id)
                        }
                    }
                }
            }
        }
        return START_STICKY
    }

    override fun update(action: String?, value: String?) {
        if(action == "SLCANCEL"){
            notificationManager.cancel(NOTIF_ID)
            stopSelf()
        }
    }

    private fun requestAudioFocus() {
        val mFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
            .setAudioAttributes(mPlaybackAttributes)
            .setAcceptsDelayedFocusGain(false)
            .setWillPauseWhenDucked(false)
            .setOnAudioFocusChangeListener(audioFocusChangeListener)
            .build()
        val mFocusLock = Any()

        // requesting audio focus
        val res = mAudioManager.requestAudioFocus(mFocusRequest)
        synchronized(mFocusLock) {
            if (res == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
                // What are you gonna do about it?
                if (mMediaPlayer!!.isPlaying) {
                    mMediaPlayer!!.pause()
                }
            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                // We don't do anything here, let's wait for the user to start playing music
            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_DELAYED) {
                // We don't do anything here, let's wait for the user to start playing music.
            }
        }
    }

    @Throws(Exception::class)
    private fun _playRadio(id: String) {
        playlist.clear()
        try{
            playlist.addAll(subsonicClient.getSimilarSongs(id))
            playlist.add(0, subsonicClient.getSong(id))
            currentTrack = playlist[0]
            if(connectivityManager.getNetworkCapabilities(connectivityManager.getActiveNetwork())
                    ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == true){
                subsonicClient.downloadPlaylist(playlist)
            }
            _loadMedia()
            _play()
        }
        catch(e: Exception){
            Globals.NotifyObservers("EX", e.message)
            // Nobody listening still
        }
    }

    private fun _playAlbum(id: String, track: Int) {
        playlist.clear()
        try{
            playlist.addAll(subsonicClient.getAlbum(id).song)
            currentTrack = playlist[track]

            if(connectivityManager.getNetworkCapabilities(connectivityManager.getActiveNetwork())
                    ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == true){
                subsonicClient.downloadPlaylist(playlist)
            }
            _loadMedia()
            _play()
        }
        catch(e:Exception){
            Globals.NotifyObservers("EX", e.message)
            // Nobody listening still
        }

    }

    private fun _pause() {
        if (mMediaPlayer!!.isPlaying) {
            mMediaPlayer!!.pause()
        }
    }

    private fun _play() {
        wasPlaying = false
        if (mMediaPlayer!!.media != null) {
            mMediaPlayer!!.play()
        }
        CoroutineScope(Dispatchers.IO).launch {
            metadataBuilder.putString(
                MediaMetadata.METADATA_KEY_ALBUM,
                currentTrack!!.album
            )
            val albumArtUri = Uri.parse(
                subsonicClient.getAlbumArt(
                    currentTrack!!.albumId
                )
            )
            var albumArtBitmap: Bitmap? = null
            try {
                albumArtBitmap = Glide.with(App.context)
                    .asBitmap()
                    .load(albumArtUri)
                    .submit()
                    .get()
            } catch (e: ExecutionException) {
                Globals.NotifyObservers("EX", e.message)
            } catch (e: InterruptedException) {
                Globals.NotifyObservers("EX", e.message)
            }

            updateMediaMetadata(albumArtBitmap)
            updateNotification(albumArtBitmap)
        }
    }

    @Throws(JSONException::class, ExecutionException::class, InterruptedException::class)
    private fun next() {
        if (playlist.indexOf(currentTrack) < playlist.size - 1) {
            currentTrack = playlist[playlist.indexOf(currentTrack) + 1]
            _loadMedia()
            _play()
        }
    }

    @Throws(JSONException::class, ExecutionException::class, InterruptedException::class)
    private fun prev() {
        if (playlist.indexOf(currentTrack) > 0) {
            currentTrack = playlist[playlist.indexOf(currentTrack) - 1]
            _loadMedia()
            _play()
        }
    }

    private fun _loadMedia() {
        var uri: String? = null
        val file = File(subsonicClient.getLocalSongUri(currentTrack!!.id))
        if (file.exists()) {
            var channel: FileChannel? = null
            var lock: FileLock? = null
            try {
                channel = RandomAccessFile(file, "rw").channel
                lock = channel.tryLock()
                uri = "file://" + file.path
            } catch (e: OverlappingFileLockException) {
                // File is locked, probably still downloading.
                uri = subsonicClient.getSongUri(currentTrack)
            } catch (e: IOException) {
                uri = subsonicClient.getSongUri(currentTrack)
            }
            if (lock != null && lock.isValid) {
                try {
                    lock.release()
                } catch (e: IOException) {
                    e.printStackTrace()
                }
            }
        } else {
            uri = subsonicClient.getSongUri(currentTrack)
        }
        if (uri != null) {
            val media = Media(mLibVLC, Uri.parse(uri))
            if (mMediaPlayer!!.isPlaying) mMediaPlayer!!.pause()
            mMediaPlayer!!.media = media
            media.release()
        }
    }

    private fun notifyListeners(action: String, value: JSObject?) {
        Globals.NotifyObservers("MS${action}", value?.toString())
    }

    override fun onEvent(event: MediaPlayer.Event) {
        if (event.type == MediaPlayer.Event.TimeChanged) {
            val position = mMediaPlayer!!.position
            notifyListeners("progress", JSObject("{\"time\": ${position}}"))
        } else if (event.type == MediaPlayer.Event.EndReached) {
            notifyListeners("stopped", null)
            try {
                next()
            } catch (e: JSONException) {
                e.printStackTrace()
            } catch (e: ExecutionException) {
                e.printStackTrace()
            } catch (e: InterruptedException) {
                e.printStackTrace()
            }
            updateNotification(null, true)
        } else if (event.type == MediaPlayer.Event.Paused || event.type == MediaPlayer.Event.Stopped) {
            notifyListeners("paused", null)
            val b: PlaybackStateCompat.Builder = getPlaybackStateBuilder().setState(
                PlaybackStateCompat.STATE_PAUSED,
                mMediaPlayer!!.position.toLong() * currentTrack!!.duration,
                0f
            )
            updateMediaSession(b.build())
            updateNotification(null, true)
        } else if (event.type == MediaPlayer.Event.Playing) {
            notifyListeners("play", null)
            notifyListeners("currentTrack", JSObject("{\"currentTrack\": ${gson.toJson(currentTrack!!)}}"))
            val b: PlaybackStateCompat.Builder = getPlaybackStateBuilder().setState(
                PlaybackStateCompat.STATE_PLAYING,
                mMediaPlayer!!.position.toLong() * currentTrack!!.duration,
                1f
            )
            updateMediaSession(b.build())
            updateNotification(null, false)
            requestAudioFocus()
        }
    }

    inner class LocalBinder : Binder() {
        // Return this instance of LocalService so clients can call public methods
        fun getCurrentState(): CurrentState {
            return CurrentState(
                this@MusicService.mMediaPlayer!!.isPlaying,
                this@MusicService.mMediaPlayer!!.position,
                this@MusicService.currentTrack ?: Song("","","",0,0,"","","","")
            )
        }

        fun next() {
            this@MusicService.next()
        }

        fun prev() {
            this@MusicService.prev()
        }

        fun play() {
            _play()
        }

        fun pause() {
            _pause()
        }

        fun playpause() {
            if (mMediaPlayer!!.isPlaying){
                _pause()
            }
            else {
                _play()
            }
        }

        fun seek(position: Float) {
            mMediaPlayer!!.position = position
        }

        fun setVolume(volume: Int) {
            mMediaPlayer!!.volume = volume
        }

        fun playRadio(id: String) {
            _playRadio(id)
        }

        fun playAlbum(id: String, track: Int) {
            _playAlbum(id, track)
        }
    }
}
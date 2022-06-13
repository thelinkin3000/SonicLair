package tech.logica10.soniclair

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
import android.graphics.Bitmap
import android.media.*
import android.media.AudioManager.OnAudioFocusChangeListener
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.provider.MediaStore
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
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

enum class SearchType {
    ARTIST,
    ALBUM,
    SONG
}

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
    private val mediaStyle: androidx.media.app.NotificationCompat.MediaStyle =
        androidx.media.app.NotificationCompat.MediaStyle()
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
        .Builder("soniclair", NotificationManagerCompat.IMPORTANCE_LOW)
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
    private val notifId = 1
    private val connectivityManager: ConnectivityManager = App.context.getSystemService(ConnectivityManager::class.java)


    private var mMediaPlayer: MediaPlayer? = null

    inner class DeviceCallback : AudioDeviceCallback() {
        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
            this@MusicService.pause()
        }
    }

    init {
        Globals.RegisterObserver(this)
        mAudioManager.registerAudioDeviceCallback(DeviceCallback(), null)
    }

    override fun onCreate() {
        super.onCreate()
        Log.i("ServiceCreation", "Created")
        notificationManager.createNotificationChannel(channel)
        try {
            mLibVLC = LibVLC(App.context, args)
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
            NotificationCompat.Action.Builder(
                R.drawable.ic_skip_previous,
                "PREV",
                pendingPrevIntent
            )
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
            NotificationCompat.Action.Builder(
                R.drawable.ic_action_cancel,
                "CANCEL",
                pendingCancelIntent
            )
        cancelAction = actionBuilder.build()

        notificationBuilder.setStyle(mediaStyle)
    }

    override fun onDestroy() {
        super.onDestroy()
        Globals.UnregisterObserver(this)
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
        notificationBuilder.addAction(if (play) playAction else pauseAction)
        notificationBuilder.addAction(nextAction)
        notificationBuilder.addAction(cancelAction)
        notificationBuilder.setOngoing(true)

        val notif = notificationBuilder.build()
        if (!isForeground) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    notifId, notif,
                    FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                )
            } else {
                startForeground(notifId, notif)
            }
            isForeground = true
        }
        notificationManager.notify(notifId, notif)
    }

    private fun updateMediaSession(playbackState: PlaybackStateCompat) {
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



    private fun getPlaybackStateBuilder(): PlaybackStateCompat.Builder {
        return PlaybackStateCompat.Builder()
            .setActions(
                PlaybackStateCompat.ACTION_PLAY
                        or PlaybackStateCompat.ACTION_PAUSE
                        or PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                        or PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
            )
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

    private fun playSearch(query: String, type: SearchType = SearchType.SONG) {
        Log.i("PlaySearch","Searching with query $query")
        when (type) {
            SearchType.SONG -> {
                val search = subsonicClient.search(query)
                if (search.song != null && search.song.isNotEmpty()) {
                    playRadio(search.song[0].id)
                }
            }
            SearchType.ARTIST, SearchType.ALBUM -> {
                val search = subsonicClient.search(query)
                if (search.album != null && search.album.isNotEmpty()) {
                    playAlbum(search.album[0].id, 0)
                }
                else if(search.song != null && search.song.isNotEmpty()){
                    playRadio(search.song[0].id)
                }
            }

        }
    }

    @Suppress("BlockingMethodInNonBlockingContext")
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action != null) {
            CoroutineScope(Dispatchers.IO).launch {
                when (intent.action) {
                    Constants.SERVICE_PLAY_PAUSE -> if (mMediaPlayer!!.isPlaying) pause() else play()
                    Constants.SERVICE_NEXT -> next()
                    Constants.SERVICE_PREV -> prev()
                    Constants.SERVICE_PLAY_ALBUM -> {
                        val id = intent.extras?.getString("id")
                        val track = intent.extras?.getInt("track")
                        if (id != null && track != null) {
                            playAlbum(id, track)
                        }
                    }
                    Constants.SERVICE_PLAY_RADIO -> {
                        val id = intent.extras?.getString("id")
                        if (id != null) {
                            playRadio(id)
                        }
                    }
                    Constants.SERVICE_PLAY_SEARCH -> {
                        val id = intent.extras?.getString("query")
                        if (id != null) {
                            playSearch(id, SearchType.SONG)
                        }
                    }
                    Constants.SERVICE_PLAY_SEARCH_ALBUM -> {
                        val id = intent.extras?.getString("query")
                        if (id != null) {
                            playSearch(id, SearchType.ALBUM)
                        }
                    }
                    Constants.SERVICE_PLAY_SEARCH_ARTIST -> {
                        val id = intent.extras?.getString("query")
                        if (id != null) {
                            playSearch(id, SearchType.ARTIST)
                        }
                    }
                    MediaStore.INTENT_ACTION_MEDIA_PLAY_FROM_SEARCH -> {
                        val mediaFocus: String? =
                            intent.getStringExtra(MediaStore.EXTRA_MEDIA_FOCUS)
                        val query: String? = intent.getStringExtra(SearchManager.QUERY)

                        // Some of these extras may not be available depending on the search mode
                        val album: String? = intent.getStringExtra(MediaStore.EXTRA_MEDIA_ALBUM)
                        val artist: String? = intent.getStringExtra(MediaStore.EXTRA_MEDIA_ARTIST)
                        val title: String? = intent.getStringExtra(MediaStore.EXTRA_MEDIA_TITLE)

                        if (query == null) {
                            return@launch
                        }
                        // Determine the search mode and use the corresponding extras
                        when {
                            mediaFocus == null -> {
                                // 'Unstructured' search mode (backward compatible)
                                playSearch(query)
                            }
                            mediaFocus.compareTo("vnd.android.cursor.item/*") == 0 -> {
                                if (query.isNotEmpty()) {
                                    // 'Unstructured' search mode
                                    playSearch(query)
                                } else {
                                    // 'Any' search mode
                                    play()
                                }
                            }
                            mediaFocus.compareTo(MediaStore.Audio.Artists.ENTRY_CONTENT_TYPE) == 0 -> {
                                // 'Artist' search mode
                                playSearch(artist!!, SearchType.ARTIST)
                            }
                            mediaFocus.compareTo(MediaStore.Audio.Albums.ENTRY_CONTENT_TYPE) == 0 -> {
                                // 'Album' search mode
                                playSearch("$album $artist")
                            }
                            mediaFocus.compareTo("vnd.android.cursor.item/audio") == 0 -> {
                                // 'Song' search mode
                                playSearch("$album $artist $title")
                            }
                        }
                    }
                }
            }
        }
        return START_STICKY
    }

    override fun update(action: String?, value: String?) {
        if (action == "SLCANCEL") {
            notificationManager.cancel(notifId)
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
            }
//            else if (res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
//                // We don't do anything here, let's wait for the user to start playing music
//            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_DELAYED) {
//                // We don't do anything here, let's wait for the user to start playing music.
//            }
        }
    }

    @Throws(Exception::class)
    private fun playRadio(id: String) {
        playlist.clear()
        try {
            playlist.addAll(subsonicClient.getSimilarSongs(id))
            playlist.add(0, subsonicClient.getSong(id))
            currentTrack = playlist[0]
            if (connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
                    ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == true
            ) {
                subsonicClient.downloadPlaylist(playlist)
            }
            loadMedia()
            play()
        } catch (e: Exception) {
            Globals.NotifyObservers("EX", e.message)
            // Nobody listening still
        }
    }

    private fun playAlbum(id: String, track: Int) {
        playlist.clear()
        try {
            playlist.addAll(subsonicClient.getAlbum(id).song)
            currentTrack = playlist[track]

            if (connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
                    ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == true
            ) {
                subsonicClient.downloadPlaylist(playlist)
            }
            loadMedia()
            play()
        } catch (e: Exception) {
            Globals.NotifyObservers("EX", e.message)
            // Nobody listening still
        }

    }

    private fun pause() {
        if (mMediaPlayer!!.isPlaying) {
            mMediaPlayer!!.pause()
        }
    }

    @Suppress("BlockingMethodInNonBlockingContext")
    private fun play() {
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
            loadMedia()
            play()
        }
    }

    @Throws(JSONException::class, ExecutionException::class, InterruptedException::class)
    private fun prev() {
        if (playlist.indexOf(currentTrack) > 0) {
            currentTrack = playlist[playlist.indexOf(currentTrack) - 1]
            loadMedia()
            play()
        }
    }

    private fun loadMedia() {
        var uri: String?
        val file = File(subsonicClient.getLocalSongUri(currentTrack!!.id))
        if (file.exists()) {
            val channel: FileChannel?
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
        when (event.type) {
            MediaPlayer.Event.TimeChanged -> {
                val position = mMediaPlayer!!.position
                notifyListeners("progress", JSObject("{\"time\": ${position}}"))
            }
            MediaPlayer.Event.EndReached -> {
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
            }
            MediaPlayer.Event.Paused, MediaPlayer.Event.Stopped -> {
                notifyListeners("paused", null)
                val b: PlaybackStateCompat.Builder = getPlaybackStateBuilder().setState(
                    PlaybackStateCompat.STATE_PAUSED,
                    mMediaPlayer!!.position.toLong() * currentTrack!!.duration,
                    0f
                )
                updateMediaSession(b.build())
                updateNotification(null, true)
            }
            MediaPlayer.Event.Playing -> {
                notifyListeners("play", null)
                notifyListeners(
                    "currentTrack",
                    JSObject("{\"currentTrack\": ${gson.toJson(currentTrack!!)}}")
                )
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
    }


    inner class LocalBinder : Binder() {
        // Return this instance of LocalService so clients can call public methods
        fun getCurrentState(): CurrentState {
            return CurrentState(
                this@MusicService.mMediaPlayer!!.isPlaying,
                this@MusicService.mMediaPlayer!!.position,
                this@MusicService.currentTrack ?: Song("", "", "", 0, 0, "", "", "", "")
            )
        }

        fun next() {
            this@MusicService.next()
        }

        fun prev() {
            this@MusicService.prev()
        }

        fun play() {
            this@MusicService.play()
        }

        fun pause() {
            this@MusicService.pause()
        }

        fun playpause() {
            if (mMediaPlayer!!.isPlaying) {
                this@MusicService.pause()
            } else {
                this@MusicService.play()
            }
        }

        fun seek(position: Float) {
            mMediaPlayer!!.position = position
        }

        fun setVolume(volume: Int) {
            mMediaPlayer!!.volume = volume
        }

        fun playRadio(id: String) {
            CoroutineScope(Dispatchers.IO).launch {
                this@MusicService.playRadio(id)
            }
        }

        fun playAlbum(id: String, track: Int) {
            CoroutineScope(Dispatchers.IO).launch {
                this@MusicService.playAlbum(id, track)
            }
        }

        fun playSearch(query: String, type: SearchType) {
            CoroutineScope(Dispatchers.IO).launch {
                this@MusicService.playSearch(query, type)
            }
        }
    }
}

class MediaCallbacks : MediaSessionCompat.Callback() {
    override fun onPlay() {
        Globals.NotifyObservers("SLPLAY", "")
    }

    override fun onPlayFromSearch(query: String?, extras: Bundle?) {
        if (query != null && query.isNotEmpty()) {
            Globals.NotifyObservers("SLPLAYSEARCH", query)
            return
        }
        Globals.NotifyObservers("SLPLAY", "")
    }

    override fun onPlayFromUri(uri: Uri?, extras: Bundle?) {
        super.onPlayFromUri(uri, extras)
    }

    override fun onPause() {
        Globals.NotifyObservers("SLPAUSE", "")
    }

    override fun onSkipToNext() {
        Globals.NotifyObservers("SLNEXT", "")
    }

    override fun onSkipToPrevious() {
        Globals.NotifyObservers("SLPREV", "")
    }
}
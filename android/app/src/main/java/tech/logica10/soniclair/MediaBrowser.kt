package tech.logica10.soniclair

import android.media.browse.MediaBrowser
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Bundle
import androidx.media.utils.MediaConstants
import android.service.media.MediaBrowserService
import okhttp3.internal.wait
import tech.logica10.soniclair.KeyValueStorage.Companion.getActiveAccount
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class MediaBrowser : MediaBrowserService() {
    private val mediaSession: MediaSession? = Globals.GetMediaSession()
    private val stateBuilder: PlaybackState.Builder = PlaybackState.Builder()
    private val executorService: ExecutorService = Executors.newFixedThreadPool(4)
    private val subsonicClient: SubsonicClient = SubsonicClient(getActiveAccount())


    override fun onCreate() {
        super.onCreate()
        // Create a MediaSessionCompat
        stateBuilder.setState(
            PlaybackState.STATE_PAUSED,
            PlaybackState.PLAYBACK_POSITION_UNKNOWN,
            1f
        )
        // Set an initial PlaybackState with ACTION_PLAY, so media buttons can start the player
        mediaSession!!.setPlaybackState(stateBuilder.build())
        // MySessionCallback() has methods that handle callbacks from a media controller
        mediaSession.setCallback(SonicLairSessionCallbacks())
        // Set the session's token so that client activities can communicate with it.
        sessionToken = mediaSession.sessionToken
    }

    override fun onGetRoot(
        clientPackageName: String,
        clientUid: Int,
        rootHints: Bundle?
    ): BrowserRoot {
        val extras = Bundle();
        extras.putInt(
            "android.media.browse.CONTENT_STYLE_PLAYABLE_HINT",
            2);
        return BrowserRoot("sonicLairRoot", extras)
    }

    override fun onLoadChildren(
        parentMediaId: String,
        result: Result<List<MediaBrowser.MediaItem>>
    ) {
        executorService.execute {
            load(subsonicClient, result)
        }
        executorService.awaitTermination(5000, TimeUnit.MILLISECONDS)
    }

    fun load(
        subsonicClient: SubsonicClient,
        result: Result<List<MediaBrowser.MediaItem>>
    ) {
        val songs = subsonicClient.getRandomSongs()
        val mediaItems = subsonicClient.getAsMediaItems(songs)
        result.sendResult(mediaItems)
    }
}
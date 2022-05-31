package tech.logica10.soniclair

import android.media.browse.MediaBrowser
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Bundle
import android.service.media.MediaBrowserService
import android.util.Log
import kotlinx.coroutines.*
import tech.logica10.soniclair.KeyValueStorage.Companion.getActiveAccount
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class MediaBrowser : MediaBrowserService() {
    private val mediaSession: MediaSession? = Globals.GetMediaSession()
    private val stateBuilder: PlaybackState.Builder = PlaybackState.Builder()
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
        val extras = Bundle()
        extras.putInt(
            "android.media.browse.CONTENT_STYLE_PLAYABLE_HINT",
            2
        )
        return BrowserRoot("sonicLairRoot", extras)
    }

    override fun onLoadChildren(
        parentMediaId: String,
        result: Result<List<MediaBrowser.MediaItem>>
    ) {
        // We're not logged in on a server, we bail
        if (getActiveAccount().username == null) {
            result.sendResult(listOf())
            return
        }
        // We try to return cached media items if we have any
        val songs = KeyValueStorage.getCachedSongs()
        // We do have them!
        if (songs.isNotEmpty()) {
            runBlocking(Dispatchers.IO) {
                result.sendResult(subsonicClient.getAsMediaItems(songs))
            }

            CoroutineScope(Dispatchers.IO).launch {
                load(subsonicClient, result, false)
            }
            return
        }

        // We have nothing for the user at this time, so let's fetch and make him wait.
        runBlocking(Dispatchers.IO) {
            load(subsonicClient, result, true)
        }
    }

    fun load(
        subsonicClient: SubsonicClient,
        result: Result<List<MediaBrowser.MediaItem>>,
        sendResult: Boolean
    ) {
        try {
            // Repopulate the media items cache
            val songs = subsonicClient.getRandomSongs()
            val mediaItems = subsonicClient.getAsMediaItems(songs)
            KeyValueStorage.setCachedSongs(songs)
            if (sendResult) {
                // If we're getting them for the front-end, set them and send them
                result.sendResult(mediaItems)
            }
        } catch (e: Exception) {
            // Something _awful_ happened. The user doesn't need to know about it
            if (sendResult) {
                result.sendResult(listOf())
            }
        }
    }
}
package tech.logica10.soniclair.services

import android.app.PendingIntent
import android.app.SearchManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.provider.MediaStore
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.MediaDescriptionCompat
import android.support.v4.media.session.MediaSessionCompat
import android.util.Log
import androidx.media.MediaBrowserServiceCompat
import com.bumptech.glide.Glide
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import tech.logica10.soniclair.*
import tech.logica10.soniclair.KeyValueStorage.Companion.getActiveAccount


class MediaBrowserService : MediaBrowserServiceCompat() {
    private val mediaSession: MediaSessionCompat? = Globals.GetMediaSession()
    private val subsonicClient: SubsonicClient = SubsonicClient(getActiveAccount())



    override fun onCreate() {
        super.onCreate()
        // Set the session's token so that client activities can communicate with it.
        sessionToken = mediaSession!!.sessionToken
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
        return BrowserRoot("HOME", extras)
    }

    fun getHome(): List<MediaBrowserCompat.MediaItem> {
        val builder = MediaDescriptionCompat.Builder()
        val ret = mutableListOf<MediaBrowserCompat.MediaItem>()
        val future = Glide.with(App.context)
            .asBitmap()
            .load(R.drawable.ic_album_art_placeholder)
            .submit()
        val albumArtBitmap: Bitmap;
        runBlocking(Dispatchers.IO) {
            albumArtBitmap = future.get()
        }

        // Random songs
        builder.setTitle("Random Songs")
        builder.setSubtitle("Rediscover your library!")
        builder.setIconBitmap(albumArtBitmap)
        builder.setMediaId("RANDOMSONGS")
        ret.add(
            MediaBrowserCompat.MediaItem(
                builder.build(),
                MediaBrowserCompat.MediaItem.FLAG_BROWSABLE
            )
        )
        // Top Albums
        builder.setTitle("Most Played Albums")
        builder.setSubtitle("Jump back to your favourites")

        builder.setIconBitmap(albumArtBitmap)
        builder.setMediaId("MOSTPLAYED")
        ret.add(
            MediaBrowserCompat.MediaItem(
                builder.build(),
                MediaBrowserCompat.MediaItem.FLAG_BROWSABLE
            )
        )
        // Playlists
        builder.setTitle("Playlists")
        builder.setSubtitle("Listen to your curated playlists")
        builder.setIconBitmap(albumArtBitmap)
        builder.setMediaId("PLAYLISTS")
        ret.add(
            MediaBrowserCompat.MediaItem(
                builder.build(),
                MediaBrowserCompat.MediaItem.FLAG_BROWSABLE
            )
        )
        return ret
    }

    override fun onLoadChildren(
        parentMediaId: String,
        result: Result<List<MediaBrowserCompat.MediaItem>>
    ) {
        if (parentMediaId == "HOME") {
            result.sendResult(getHome())
        } else if (parentMediaId == "RANDOMSONGS") {
            // We're not logged in on a server, we bail
            if (getActiveAccount().username == null) {
                result.sendResult(listOf())
                return
            }

            // We try to return cached media items if we have any
            val songs = KeyValueStorage.getCachedSongs()

            // Fetch new songs for the next time
            CoroutineScope(Dispatchers.IO).launch {
                load(subsonicClient)
            }
            // We do have some songs!
            if (songs.isNotEmpty()) {
                runBlocking(Dispatchers.IO) {
                    result.sendResult(subsonicClient.getSongsAsMediaItems(songs))
                }
            } else {
                // We have nothing for the user at this time, returning an empty list so as to not block the UI.
                result.sendResult(listOf())
            }
        } else if (parentMediaId == "PLAYLISTS") {
            // We're not logged in on a server, we bail
            if (getActiveAccount().username == null) {
                result.sendResult(listOf())
                return
            }

            // We try to return cached media items if we have any
            val playlists = KeyValueStorage.getCachedPlaylists()

            // Fetch new songs for the next time
            CoroutineScope(Dispatchers.IO).launch {
                load(subsonicClient)
            }
            // We do have some songs!
            if (playlists.isNotEmpty()) {
                runBlocking(Dispatchers.IO) {
                    result.sendResult(subsonicClient.getPlaylistsAsMediaItems(playlists))
                }
            } else {
                // We have nothing for the user at this time, returning an empty list so as to not block the UI.
                result.sendResult(listOf())
            }
        } else if (parentMediaId == "MOSTPLAYED") {
            // We're not logged in on a server, we bail
            if (getActiveAccount().username == null) {
                result.sendResult(listOf())
                return
            }

            // We try to return cached media items if we have any
            val albums = KeyValueStorage.getCachedAlbums()

            // Fetch new songs for the next time
            CoroutineScope(Dispatchers.IO).launch {
                load(subsonicClient)
            }
            // We do have some songs!
            if (albums.isNotEmpty()) {
                runBlocking(Dispatchers.IO) {
                    result.sendResult(subsonicClient.getAlbumsAsPlaylistsItems(albums))
                }
            } else {
                // We have nothing for the user at this time, returning an empty list so as to not block the UI.
                result.sendResult(listOf())
            }
        }
    }

    override fun onSearch(
        query: String,
        extras: Bundle?,
        result: Result<MutableList<MediaBrowserCompat.MediaItem>>
    ) {
        val intent = Intent(MediaStore.INTENT_ACTION_MEDIA_PLAY_FROM_SEARCH)
        intent.putExtra(MediaStore.EXTRA_MEDIA_FOCUS, "vnd.android.cursor.item/*")
        intent.putExtra(SearchManager.QUERY, query)
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pendingIntent =
            PendingIntent.getBroadcast(App.context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
        pendingIntent.send()
    }

    fun load(
        subsonicClient: SubsonicClient
    ) {
        try {
            // Repopulate the media items cache
            val songs = subsonicClient.getRandomSongs()
            KeyValueStorage.setCachedSongs(songs)
            val albums = subsonicClient.getTopAlbums()
            KeyValueStorage.setCachedAlbums(albums)
            val playlists = subsonicClient.getPlaylists()
            KeyValueStorage.setCachedPlaylists(
                playlists.subList(
                    0,
                    if (playlists.size > 9) 9 else playlists.size
                )
            )
        } catch (e: Exception) {
            // Something _awful_ happened. The user doesn't need to know about it
            Log.e("MediaBrowser", e.message!!)
        }
    }
}
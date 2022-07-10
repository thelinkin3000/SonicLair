@file:Suppress("BlockingMethodInNonBlockingContext")

package tech.logica10.soniclair


import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.MediaDescriptionCompat
import android.util.Base64
import android.util.Log
import androidx.room.Room
import com.bumptech.glide.Glide
import com.getcapacitor.JSObject
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.launch
import okhttp3.*
import okhttp3.Credentials.basic
import okio.Buffer
import okio.buffer
import okio.sink
import tech.logica10.soniclair.models.*
import tech.logica10.soniclair.room.database.SoniclairDatabase
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream
import java.math.BigInteger
import java.security.MessageDigest
import java.time.Duration
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

@SuppressLint("NewApi")
class SubsonicClient(var initialAccount: Account) {
    companion object {
        var account: Account = Account(null, "", "", "", false)
        var spotifyToken: String = ""
        var downloadQueue: MutableList<Song> = mutableListOf()
        var downloadQueueForce: HashMap<String, Boolean> = HashMap()
        var downloading: Boolean = false
    }

    val db: SoniclairDatabase
    private val connectivityManager: ConnectivityManager

    init {
        account = initialAccount
        val authority =
            if (initialAccount.url != "") Uri.parse(initialAccount.url).authority else ""
        db = Room.databaseBuilder(
            App.context,
            SoniclairDatabase::class.java, "soniclair${authority}"
        ).build()
        connectivityManager = App.context.getSystemService(ConnectivityManager::class.java)
    }

    val client: OkHttpClient = OkHttpClient.Builder()
        .readTimeout(5000, TimeUnit.MILLISECONDS)
        .writeTimeout(5000, TimeUnit.MILLISECONDS)
        .build()


    private fun getBasicParams(): BasicParams {
        val salt = "abcd1234"
        val saltedPassword = "${account.password}${salt}"
        val md = MessageDigest.getInstance("MD5")
        val hash =
            BigInteger(1, md.digest(saltedPassword.toByteArray())).toString(16).padStart(32, '0')
        return BasicParams(
            account.username ?: "",
            if (account.usePlaintext) null else hash,
            if (account.usePlaintext) null else salt,
            "1.16.1",
            "soniclair",
            "json",
            if (account.usePlaintext) account.password else null
        )
    }

    fun getSongsAsMediaItems(songs: List<Song>): List<MediaBrowserCompat.MediaItem> {
        val builder = MediaDescriptionCompat.Builder()
        val ret = mutableListOf<MediaBrowserCompat.MediaItem>()
        for (item in songs) {
            builder.setTitle(item.title)
            builder.setSubtitle(String.format("by %s", item.artist))
            val albumArtBitmap: Bitmap = if (File(getLocalCoverArtUri(item.albumId)).exists()) {
                Log.i("BitmapMediaItem", "Loading from disk")
                BitmapFactory.decodeFile(getLocalCoverArtUri(item.albumId))
            } else {
                Log.i("BitmapMediaItem", "Loading from server")
                val albumArtUri = Uri.parse(getAlbumArt(item.albumId))
                try {
                    val futureBitmap = Glide.with(App.context)
                        .asBitmap()
                        .load(albumArtUri)
                        .submit()
                    futureBitmap.get()
                } catch (e: Exception) {
                    val placeholder = Glide.with(App.context)
                        .asBitmap()
                        .load(R.drawable.ic_album_art_placeholder)
                        .submit()
                    placeholder.get()
                }
            }
            Log.i("BitmapMediaItem", "Loaded successfully")
            builder.setIconBitmap(albumArtBitmap)
            builder.setMediaId("s${item.id}")
            ret.add(
                MediaBrowserCompat.MediaItem(
                    builder.build(),
                    MediaBrowserCompat.MediaItem.FLAG_PLAYABLE
                )
            )
        }
        return ret
    }

    fun getPlaylistsAsMediaItems(playlists: List<Playlist>): List<MediaBrowserCompat.MediaItem> {
        val builder = MediaDescriptionCompat.Builder()
        val ret = mutableListOf<MediaBrowserCompat.MediaItem>()
        for (item in playlists) {
            builder.setTitle(item.name)
            builder.setSubtitle(item.comment)
            val albumArtBitmap: Bitmap = if (File(getLocalCoverArtUri(item.coverArt ?: "")).exists()) {
                Log.i("BitmapMediaItem", "Loading from disk")
                BitmapFactory.decodeFile(getLocalCoverArtUri(item.coverArt ?: ""))
            } else {
                Log.i("BitmapMediaItem", "Loading from server")
                val albumArtUri = Uri.parse(getAlbumArt(item.coverArt ?: ""))
                try {
                    val futureBitmap = Glide.with(App.context)
                        .asBitmap()
                        .load(albumArtUri)
                        .submit()
                    futureBitmap.get()
                } catch (e: Exception) {
                    val placeholder = Glide.with(App.context)
                        .asBitmap()
                        .load(R.drawable.ic_album_art_placeholder)
                        .submit()
                    placeholder.get()
                }
            }
            Log.i("BitmapMediaItem", "Loaded successfully")
            builder.setIconBitmap(albumArtBitmap)
            builder.setMediaId("p${item.id}")
            ret.add(
                MediaBrowserCompat.MediaItem(
                    builder.build(),
                    MediaBrowserCompat.MediaItem.FLAG_PLAYABLE
                )
            )
        }
        return ret
    }

    fun getAlbumsAsPlaylistsItems(albums: List<Album>): List<MediaBrowserCompat.MediaItem> {
        val builder = MediaDescriptionCompat.Builder()
        val ret = mutableListOf<MediaBrowserCompat.MediaItem>()
        for (item in albums) {
            builder.setTitle(item.name)
            builder.setSubtitle(String.format("by %s", item.artist))
            val albumArtBitmap: Bitmap = if (File(getLocalCoverArtUri(item.id)).exists()) {
                Log.i("BitmapMediaItem", "Loading from disk")
                BitmapFactory.decodeFile(getLocalCoverArtUri(item.id))
            } else {
                Log.i("BitmapMediaItem", "Loading from server")
                val albumArtUri = Uri.parse(getAlbumArt(item.id))
                try {
                    val futureBitmap = Glide.with(App.context)
                        .asBitmap()
                        .load(albumArtUri)
                        .submit()
                    futureBitmap.get()
                } catch (e: Exception) {
                    val placeholder = Glide.with(App.context)
                        .asBitmap()
                        .load(R.drawable.ic_album_art_placeholder)
                        .submit()
                    placeholder.get()
                }
            }
            Log.i("BitmapMediaItem", "Loaded successfully")
            builder.setIconBitmap(albumArtBitmap)
            builder.setMediaId("a${item.id}")
            ret.add(
                MediaBrowserCompat.MediaItem(
                    builder.build(),
                    MediaBrowserCompat.MediaItem.FLAG_PLAYABLE
                )
            )
        }
        return ret
    }

    fun isCached(id: String): Boolean {
        return File(getLocalSongUri(id)).exists()
    }

    private fun getSongDownload(id: String): String {
        val uriBuilder = Uri.parse(account.url).buildUpon()
            .appendPath("rest")
            .appendPath("download")
        val map = this.getBasicParams().asMap()
        for (key in map.keys) {
            uriBuilder.appendQueryParameter(key, map[key])
        }
        uriBuilder.appendQueryParameter("id", id)
        return uriBuilder.build().toString()
    }

    private fun getSongsDirectory(): String {
        val uri = Uri.parse(account.url)
        return "${uri.authority}/songs/"
    }

    private fun getArtistArtsDirectory(): String {
        val uri = Uri.parse(account.url)
        return Helpers.constructPath(
            listOf(
                App.context.filesDir.path,
                "${uri.authority}/artistArts/"
            )
        )
    }

    private fun getLocalArtistArtUri(id: String): String {
        return Helpers.constructPath(listOf(getArtistArtsDirectory(), "${id}.png"))
    }

    private fun getCoverArtsDirectory(): String {
        val uri = Uri.parse(account.url)
        return Helpers.constructPath(
            listOf(
                App.context.filesDir.path,
                "${uri.authority}/albumArts/"
            )
        )
    }

    private fun getLocalCoverArtUri(id: String): String {
        return Helpers.constructPath(listOf(getCoverArtsDirectory(), "${id}.png"))
    }

    fun getLocalSongUri(id: String): String {
        return Helpers.constructPath(listOf(App.context.filesDir.path, getSongsDirectory(), id))
    }

    private fun unregisterSong(id: String) {
        val s: Song? = db.songDao().get(id)
        if (s != null) {
            val albumId = s.albumId
            try {
                db.songDao().delete(s)
            } catch (e: Exception) {
                Globals.NotifyObservers("EX", e.message)
                return
            }
            checkAndUnregisterAlbum(albumId)
        }
    }

    private fun checkAndUnregisterAlbum(id: String) {
        val a: Album? = db.albumDao().get(id)
        if (a != null) {
            val s: List<Song> = db.songDao().getByAlbum(id)
            if (s.isEmpty()) {
                val artistId = a.artistId
                try {
                    db.albumDao().delete(a)
                } catch (e: Exception) {
                    Globals.NotifyObservers("EX", e.message)
                    return
                }
                checkAndUnregisterArtist(artistId)
            }
        }

    }

    private fun checkAndUnregisterArtist(id: String) {
        val a: Artist? = db.artistDao().get(id)
        if (a != null) {
            val albums: List<Album> = db.albumDao().getByArtist(id)
            if (albums.isEmpty()) {
                try {
                    db.artistDao().delete(a)
                } catch (e: Exception) {
                    Globals.NotifyObservers("EX", e.message)
                    return
                }
            }
        }
    }

    private fun registerSong(song: Song) {
        val s: Song? = db.songDao().get(song.id)
        if (s == null) {
            Log.i("LocalCacheDB", "Registering song ${song.id}")
            try {
                db.songDao().insert(song)
            } catch (e: Exception) {
                Globals.NotifyObservers("EX", e.message)
            }
        }
        if (db.albumDao().get(song.albumId) == null) {
            registerAlbum(getAlbum(song.albumId))
        }
    }

    private fun registerAlbum(album: Album) {
        val a: Album? = db.albumDao().get(album.id)
        if (a == null) {
            album.created =
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))

            try {
                db.albumDao().insert(album)
            } catch (e: Exception) {
                Globals.NotifyObservers("EX", e.message)
            }
            Log.i("LocalCacheDB", "Registering album ${album.id}")
        }
        if (db.artistDao().get(album.artistId) == null) {
            registerArtist(getArtist(album.artistId))
        }
    }

    private fun registerArtist(artist: Artist) {
        val a: Artist? = db.artistDao().get(artist.id)
        if (a == null) {
            try {
                db.artistDao().insert(artist)
            } catch (e: Exception) {
                Globals.NotifyObservers("EX", e.message)
            }
            Log.i("LocalCacheDB", "Registering artist ${artist.id}")
        }
    }

    fun getLocalArtists(): List<Artist> {
        return db.artistDao().getAll()
    }

    fun getLocalArtist(id: String): Artist? {
        return db.artistDao().get(id)
    }

    fun getLocalArtistWithAlbums(id: String): Artist? {
        val artist = getLocalArtist(id) ?: return null
        artist.album = db.albumDao().getByArtist(id).sortedBy { s -> s.year }
        artist.albumCount = artist.album.size
        return artist
    }

    fun getLocalAlbums(take: Int, sortedByDate: Boolean = false): List<Album> {
        return db.albumDao().getAll().take(take)
            .sortedBy { s -> if (sortedByDate) s.created else s.name }
    }

    private fun getLocalAlbum(id: String): Album? {
        return db.albumDao().get(id)
    }

    fun getLocalAlbumWithSongs(id: String): AlbumWithSongs? {
        val album: Album = getLocalAlbum(id) ?: return null
        val ret = AlbumWithSongs(album)
        ret.song = db.songDao().getByAlbum(id).sortedBy { s -> s.track }
        return ret
    }

    private fun downloadSong(id: String) {
        try {
            val request: Request = Request.Builder().url(getSongDownload(id)).build()
            Log.i("SonicLair", "Downloading song $id")
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                Globals.NotifyObservers("EX", response.message)
                return
            }
            val dirPath =
                Helpers.constructPath(listOf(App.context.filesDir.path, getSongsDirectory()))
            val dir = File(dirPath)
            if (!dir.exists())
                dir.mkdirs()
            val file = File(getLocalSongUri(id))
            val body = response.body
            val contentLength = body!!.contentLength()
            val source = body.source()
            val sink = file.sink().buffer()
            val sinkBuffer: Buffer = sink.buffer
            var totalBytesRead: Long = 0
            val bufferSize: Long = 8 * 1024
            var bytesRead: Long
            var time = LocalDateTime.now()
            while (source.read(sinkBuffer, bufferSize).also { bytesRead = it } != -1L) {
                sink.emit()
                totalBytesRead += bytesRead
                val progress = (totalBytesRead * 100 / contentLength).toInt()
                if (Duration.between(time, LocalDateTime.now()).toMillis() > 200) {
                    time = LocalDateTime.now()
                    Globals.NotifyObservers("MSprogress${id}", "{\"progress\":${progress}}")
                }

            }
            Globals.NotifyObservers("MSprogress${id}", "{\"progress\":100}")
            sink.flush()
            sink.close()
        } catch (e: Exception) {
            Globals.NotifyObservers("EX", e.message)
            // It's probable the download failed and we have a malformed file.
            // Gotta prune it.
            if (File(getLocalSongUri(id)).exists()) {
                File(getLocalSongUri(id)).delete()
            }
        }

    }

    inline fun <reified T : Any> makeSubsonicRequest(
        path: List<String>,
        parameters: HashMap<String, String>?,
        emptyResponse: Boolean = false
    ): T? {
        val uriBuilder = Uri.parse(account.url).buildUpon()
        for (p in path) {
            uriBuilder.appendPath(p)
        }
        if (parameters != null) {
            for (key in parameters.keys) {
                if (parameters[key] == null) {
                    continue
                }
                if (parameters[key]!!.contains(",")) {
                    parameters[key]!!.split(",").forEach {
                        uriBuilder.appendQueryParameter(key, it.trim())
                    }
                } else {
                    uriBuilder.appendQueryParameter(key, parameters[key])
                }
            }
        }

        val requestBuilder: Request.Builder = Request.Builder()
            .url(uriBuilder.build().toString())
            .get()

        //4. Synchronous call to the REST API
        val response: Response = client.newCall(requestBuilder.build()).execute()
        if (!response.isSuccessful) {
            throw Exception(response.message)
        }
        val body = response.body?.string()
        val realResponse = JSObject(body).get("subsonic-response").toString()
        val status = JSObject(body).getJSObject("subsonic-response")?.getString("status")
            ?: throw Exception("There was an internal error in the server. Please check your server logs.")
        if (status == "failed") {
            throw Exception(
                JSObject(body).getJSObject("subsonic-response")?.getJSObject("error")
                    ?.getString("message")
            )
        }
        if (emptyResponse) {
            return null
        }
        return Gson().fromJson(
            realResponse,
            T::class.java
        )
    }

    fun search(query: String): SearchResult {
        val params = getBasicParams().asMap()
        params["query"] = query
        return makeSubsonicRequest<SearchResponse>(
            listOf("rest", "search3"),
            params
        )!!.searchResult3
    }


    fun getArtists(): List<Artist> {

        val artistsResponse = makeSubsonicRequest<ArtistsSubsonicResponse>(
            listOf("rest", "getArtists"),
            getBasicParams().asMap()
        )
        val ret: MutableList<Artist> = mutableListOf()
        artistsResponse!!.artists.index.forEach { artistIndex ->
            ret.addAll(artistIndex.artist.map { artistItem ->
                Artist(
                    artistItem.id,
                    artistItem.name,
                    artistItem.albumCount
                )
            })
        }
        return ret
    }

    fun getArtist(id: String): Artist {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<ArtistSubsonicResponse>(
            listOf("rest", "getArtist"),
            params
        )!!.artist
    }

    fun getAlbums(): List<Album> {
        var page = 0
        var more = true
        val ret = mutableListOf<Album>()
        while (more) {
            val params = getBasicParams().asMap()
            params["type"] = "alphabeticalByName"
            params["size"] = "500"
            params["offset"] = (page * 500).toString()
            ret.addAll(
                makeSubsonicRequest<AlbumsResponse>(
                    listOf("rest", "getAlbumList2"),
                    params
                )!!.albumList2.album
            )
            if (ret.size % 500 != 0) {
                more = false
            }
            page++
        }
        return ret
    }

    fun getAlbum(id: String): AlbumWithSongs {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<AlbumResponse>(
            listOf("rest", "getAlbum"),
            params
        )!!.album
    }

    private fun getArtistInfo(id: String): ArtistInfo {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<ArtistInfoResponse>(
            listOf("rest", "getArtistInfo2"),
            params
        )!!.artistInfo2
    }

    fun getTopAlbums(type: String = "frequent", size: Int = 10): List<Album> {
        val params = getBasicParams().asMap()
        params["type"] = type
        params["size"] = size.toString()

        return makeSubsonicRequest<AlbumsResponse>(
            listOf("rest", "getAlbumList2"),
            params
        )!!.albumList2.album
    }

    fun getAlbumArt(id: String): String {
        val uriBuilder = Uri.parse(account.url).buildUpon()
            .appendPath("rest")
            .appendPath("getCoverArt")
        val map = this@SubsonicClient.getBasicParams().asMap()
        for (key in map.keys) {
            uriBuilder.appendQueryParameter(key, map[key])
        }
        uriBuilder.appendQueryParameter("id", id)
        CoroutineScope(IO).launch {
            try {
                if (!File(getLocalCoverArtUri(id)).exists()) {
                    Log.i("Image saver", "Fetching image $id")
                    saveImage(
                        try {

                            Glide.with(App.context)
                                .asBitmap()
                                .load(uriBuilder.toString())
                                .submit()
                                .get()
                        } catch (e: Exception) {
                            Glide.with(App.context)
                                .asBitmap()
                                .load(R.drawable.ic_album_art_placeholder)
                                .submit()
                                .get()
                        },
                        getCoverArtsDirectory(),
                        getLocalCoverArtUri(id)
                    )
                }
            } catch (e: Exception) {
                Log.e("Image saver", e.message!!)
                Globals.NotifyObservers("EX", e.message)
            }

        }
        return uriBuilder.toString()
    }

    fun getSpotifyToken(): String {
        if (spotifyToken == "") {
            val clientId = "3cb3ecad8ce14e1dba560e3b5ceb908b"
            val clientSecret = "86810d6f234142a9bf7be9d2a924bbba"
            val uriBuilder = Uri.Builder()
                .scheme("https")
                .authority("accounts.spotify.com")
                .appendPath("api")
                .appendPath("token")
            val body: RequestBody = FormBody.Builder()
                .add("grant_type", "client_credentials")
                .build()
            val request: Request = Request.Builder()
                .url(uriBuilder.build().toString())
                .addHeader("Accept", "application/json")
                .addHeader("Content-Type", "application/x-www-form-urlencoded")
                .addHeader(
                    "Authorization",
                    basic(clientId, clientSecret)
                )
                .post(body)
                .build()
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                spotifyToken = JSObject(
                    response.body?.string() ?: "{\"access_token\": \"\"}"
                ).getString("access_token").toString()

            } else {
                throw Exception(response.message)
            }
        }
        return spotifyToken
    }

    fun scrobble(id: String) {
        val params = getBasicParams().asMap()
        params["id"] = id
        makeSubsonicRequest<SubsonicResponse>(
            listOf(
                "rest",
                "scrobble"
            ), params, true
        )
    }

    private fun getSpotifyArtistArt(name: String): String? {
        val uriBuilder = Uri.parse("https://api.spotify.com/v1/search").buildUpon()
        uriBuilder.appendQueryParameter("q", name)
        uriBuilder.appendQueryParameter("type", "artist")

        val requestBuilder: Request.Builder = Request.Builder()
            .url(uriBuilder.build().toString())
            .get()
            .addHeader("Accept", "application/json")
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer ${getSpotifyToken()}")
        //4. Synchronous call to the REST API
        val response: Response = client.newCall(requestBuilder.build()).execute()
        if (!response.isSuccessful) {
            throw Exception(response.message)
        }
        val body = response.body?.string()
        val realResponse =
            JSObject(body).getJSObject("data")?.getJSObject("artists")?.getJSONArray("items")
                ?: return null
        val first = realResponse.getJSONObject(0) ?: return null
        if (first.getString("name") == name) {
            return first.getJSONArray("images").getJSONObject(0)?.getString("url")
        }
        return null
    }

    fun getArtistArt(id: String): String {
        val artist = getArtist(id)
        var art: String? = getSpotifyArtistArt(artist.name)
        if (art == null) {
            // Falling back to the artistInfo provided by navidrome
            val artistInfo = getArtistInfo(id)
            art = artistInfo.largeImageUrl
        }
        CoroutineScope(IO).launch {
            if (!File(getLocalArtistArtUri(id)).exists()) {
                saveImage(
                    Glide.with(App.context)
                        .asBitmap()
                        .load(art) // sample image
                        .submit()
                        .get(),
                    getCoverArtsDirectory(),
                    getLocalCoverArtUri(id)
                )
            }
        }
        return art
    }

    private fun getLocalAlbumArtFile(id: String): File {
        val file = File(getLocalCoverArtUri(id))
        if (!file.exists()) {
            throw Exception("There isn't a cached version of this cover art.")
        }
        return file
    }

    fun getLocalAlbumArt(id: String): String {
        return "data:image/png;base64,${
            Base64.encodeToString(
                getLocalAlbumArtFile(id).readBytes(),
                Base64.NO_WRAP
            )
        }"
    }

    fun getLocalArtistArt(id: String): String {
        val file = File(getLocalArtistArtUri(id))
        if (!file.exists()) {
            throw Exception("There isn't a cached version of this artist art.")
        }
        return "data:image/png;base64,${Base64.encodeToString(file.readBytes(), Base64.NO_WRAP)}"
    }

    fun getRandomSongs(): List<Song> {
        val params = getBasicParams().asMap()
        params["size"] = "10"
        return makeSubsonicRequest<RandomSongsResponse>(
            listOf("rest", "getRandomSongs"),
            params
        )!!.randomSongs.song
    }

    fun getSongUri(song: Song?): String? {
        if (song == null) {
            return null
        }
        val uriBuilder = Uri.parse(account.url).buildUpon()
            .appendPath("rest")
            .appendPath("stream")
        val map = this.getBasicParams().asMap()
        for (key in map.keys) {
            uriBuilder.appendQueryParameter(key, map[key])
        }
        uriBuilder.appendQueryParameter("id", song.id)
        uriBuilder.appendQueryParameter("estimateContentLength", "true")


        if (KeyValueStorage.getSettings().transcoding != "" && connectivityManager.getNetworkCapabilities(
                connectivityManager.activeNetwork
            )
                ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) == false
        ) {
            uriBuilder.appendQueryParameter("format", KeyValueStorage.getSettings().transcoding)

        }
        return uriBuilder.build().toString()
    }

    fun getSimilarSongs(id: String): List<Song> {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<SimilarSongsResponse>(
            listOf("rest", "getSimilarSongs2"),
            params
        )!!.similarSongs2.song
    }

    fun getSong(id: String): Song {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<SongResponse>(
            listOf("rest", "getSong"),
            params
        )!!.song
    }

    fun getPlaylist(id: String): Playlist {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<PlaylistResponse>(
            listOf("rest", "getPlaylist"),
            params
        )!!.playlist
    }

    fun getPlaylists(): List<Playlist> {
        val params = getBasicParams().asMap()
        return makeSubsonicRequest<PlaylistsResponse>(
            listOf("rest", "getPlaylists"),
            params
        )!!.playlists.playlist
    }

    fun removePlaylist(id: String) {
        val params = getBasicParams().asMap()
        params["id"] = id
        makeSubsonicRequest<PlaylistResponse>(
            listOf("rest", "deletePlaylist"),
            params,
            true
        )
    }

    fun removeFromPlaylist(id: String, track: Int) {
        val params = getBasicParams().asMap()
        params["playlistId"] = id
        params["songIndexToRemove"] = track.toString()
        makeSubsonicRequest<PlaylistResponse>(
            listOf("rest", "updatePlaylist"),
            params,
            true
        )
    }

    fun addToPlaylist(id: String, songId: String) {
        val params = getBasicParams().asMap()
        params["playlistId"] = id
        params["songIdToAdd"] = songId
        makeSubsonicRequest<PlaylistResponse>(
            listOf("rest", "updatePlaylist"),
            params,
            true
        )
    }

    fun updatePlaylist(playlist: Playlist): Playlist {
        val params = getBasicParams().asMap()
        params["name"] = playlist.name
        params["comment"] = playlist.comment ?: ""
        params["public"] = if (playlist.public) "true" else "false"
        params["playlistId"] = playlist.id
        makeSubsonicRequest<PlaylistResponse>(
            listOf("rest", "updatePlaylist"),
            params,
            true
        )
        val songsParams = getBasicParams().asMap()
        songsParams["playlistId"] = playlist.id
        songsParams["songId"] = playlist.entry.joinToString(",") { it.id }
        return makeSubsonicRequest<PlaylistResponse>(
            listOf("rest", "createPlaylist"),
            songsParams
        )!!.playlist
    }

    fun createPlaylist(ids: List<String>, name: String): Playlist {
        val songsParams = getBasicParams().asMap()
        songsParams["name"] = name
        songsParams["songId"] = ids.joinToString(",")
        return makeSubsonicRequest<PlaylistResponse>(
            listOf("rest", "createPlaylist"),
            songsParams
        )!!.playlist
    }


    fun login(username: String, password: String, url: String, usePlaintext: Boolean): Account {
        val salt = "abcd1234"
        val saltedPassword = "${password}${salt}"
        val md = MessageDigest.getInstance("MD5")
        val hash =
            BigInteger(1, md.digest(saltedPassword.toByteArray())).toString(16).padStart(32, '0')
        val basicParams = BasicParams(
            username,
            if (usePlaintext) null else hash,
            if (usePlaintext) null else salt,
            "1.16.1",
            "soniclair",
            "json",
            if (usePlaintext) password else null
        )
        val uriBuilder = Uri.parse(url).buildUpon()
            .appendPath("rest")
            .appendPath("getArtists")
        val map = basicParams.asMap()
        for (key in map.keys) {
            uriBuilder.appendQueryParameter(key, map[key])
        }

        val requestBuilder: Request.Builder = Request.Builder()
            .url(uriBuilder.build().toString())
            .get()

        //4. Synchronous call to the REST API
        val response: Response = client.newCall(requestBuilder.build()).execute()
        if (!response.isSuccessful) {
            throw Exception("There was an error reaching the server. Please check your connection.")
        }
        val body = response.body?.string()
        val realResponse = JSObject(body).get("subsonic-response").toString()
        val ret = Gson().fromJson(realResponse, ArtistsSubsonicResponse::class.java)
        if (ret.status != "ok") {
            throw Exception(ret.error?.message)
        }
        account = Account(username, password, url, ret.type ?: "Unknown Server", usePlaintext)
        KeyValueStorage.setActiveAccount(account)
        val accounts = KeyValueStorage.getAccounts()
        val exists = accounts.filter { it.url == url }.size == 1
        val list: MutableList<Account> = if (exists) {
            KeyValueStorage.getAccounts().filter { it.url != url }.toMutableList()
        } else {
            KeyValueStorage.getAccounts().toMutableList()
        }
        list.add(account)
        KeyValueStorage.setAccounts(list)
        return account
    }

    fun downloadPlaylist(playlist: List<Song>, force: Boolean) {
        downloadQueue.addAll(playlist)
        playlist.forEach {
            downloadQueueForce[it.id] = force
        }
        if (!downloading) {
            download(true)
        }
    }

    private fun download(spawn: Boolean) {
        if (downloadQueue.size > 0) {
            downloading = true
            val index = if (spawn) 2 else 0
            for (i in 0..index) {
                CoroutineScope(IO).launch {
                    Thread.sleep(i.toLong() * 500)
                    if (downloadQueue.size == 0) {
                        return@launch
                    }
                    val song = downloadQueue[0]
                    val force = downloadQueueForce[song.id] ?: false
                    downloadQueueForce.remove(downloadQueue[0].id)
                    downloadQueue.removeAt(0)
                    if (KeyValueStorage.getSettings().cacheSize > 0) {
                        val dir = File(
                            Helpers.constructPath(
                                listOf(
                                    App.context.filesDir.path,
                                    getSongsDirectory()
                                )
                            )
                        )
                        if (dir.exists()) {
                            val files = dir.listFiles()?.toList()
                                ?.sortedBy { file -> file.lastModified() }?.toMutableList()
                                ?: mutableListOf<File>()
                            var size = files.sumOf { it.length() }
                            while (size > KeyValueStorage.getSettings().cacheSize * (1024 * 1024 * 1024)) {
                                files[0].delete()
                                files.remove(files[0])
                                unregisterSong(files[0].name)
                                size = files.sumOf { it.length() }
                            }
                        }
                    }
                    if (!File(getLocalSongUri(song.id)).exists() || force) {
                        registerSong(song)
                        downloadSong(song.id)
                    }
                    download(false)
                }
            }
        } else {
            downloading = false
        }
    }

}

private fun saveImage(image: Bitmap, directory: String, path: String) {
    val storageDir = File(directory)
    var success = true
    if (!storageDir.exists()) {
        success = storageDir.mkdirs()
    }
    if (success) {
        val imageFile = File(path)
        try {
            val fOut: OutputStream = FileOutputStream(imageFile)
            image.compress(Bitmap.CompressFormat.PNG, 100, fOut)
            fOut.flush()
            fOut.close()
            Log.i("Image save", "image successfully saved")
        } catch (e: Exception) {
            Log.e("Image saver", e.message!!)
            Globals.NotifyObservers("EX", e.message)
        }
    }
}


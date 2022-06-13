package tech.logica10.soniclair


import android.net.Uri
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.MediaDescriptionCompat
import android.util.Log
import com.bumptech.glide.Glide
import com.getcapacitor.JSObject
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers.IO
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okio.*
import tech.logica10.soniclair.SubsonicModels.*
import java.io.File
import java.math.BigInteger
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import kotlin.io.path.Path


class Account(val username: String?, val password: String, val url: String, var type: String)
class Settings(val cacheSize: Int)

class SubsonicClient(var initialAccount: Account) {
    companion object {
        var account: Account = Account(null, "", "", "")
    }

    init {
        account = initialAccount
    }

    val client: OkHttpClient = OkHttpClient.Builder()
        .readTimeout(5000, TimeUnit.MILLISECONDS)
        .writeTimeout(5000, TimeUnit.MILLISECONDS)
        .build()

    fun getBasicParams(): BasicParams {
        val salt = "abcd1234"
        val saltedPassword = "${account.password}${salt}"
        val md = MessageDigest.getInstance("MD5")
        val hash =
            BigInteger(1, md.digest(saltedPassword.toByteArray())).toString(16).padStart(32, '0')
        return BasicParams(
            account.username ?: "",
            hash,
            salt,
            "1.16.1",
            "soniclair",
            "json",
        )
    }

    fun getAsMediaItems(songs: List<Song>): List<MediaBrowserCompat.MediaItem> {
        val builder = MediaDescriptionCompat.Builder()
        val ret = mutableListOf<MediaBrowserCompat.MediaItem>()
        for (item in songs) {
            builder.setTitle(item.title)
            builder.setSubtitle(String.format("by %s", item.artist))
            val albumArtUri = Uri.parse(getAlbumArt(item.coverArt))
            val futureBitmap = Glide.with(App.context)
                .asBitmap()
                .load(albumArtUri)
                .submit()
            val albumArtBitmap = futureBitmap.get()
            builder.setIconBitmap(albumArtBitmap)
            builder.setMediaId(item.id)
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

//    fun getCoverArtsDirectory(): String {
//        val uri = Uri.parse(account.url)
//        return "${uri.authority}/albumArts/"
//    }

//    fun getLocalCoverArtUri(id: String): String {
//        return Path(App.context.filesDir.path, getCoverArtsDirectory(), "${id}.png").toString()
//    }

    fun getLocalSongUri(id: String): String {
        return Path(App.context.filesDir.path, getSongsDirectory(), id).toString()
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
            val dirPath = Path(App.context.filesDir.path, getSongsDirectory()).toString()
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
            while (source.read(sinkBuffer, bufferSize).also { bytesRead = it } != -1L) {
                sink.emit()
                totalBytesRead += bytesRead
                val progress = (totalBytesRead * 100 / contentLength).toInt()
                Globals.NotifyObservers("MSprogress${id}", "{\"progress\":${progress}}")
            }
            sink.flush()
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
        parameters: HashMap<String, String>?
    ): T {
        val uriBuilder = Uri.parse(account.url).buildUpon()
        for (p in path) {
            uriBuilder.appendPath(p)
        }
        if (parameters != null) {
            for (key in parameters.keys) {
                uriBuilder.appendQueryParameter(key, parameters[key])
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
        ).searchResult3
    }


    fun getArtists(): ArtistsSubsonicResponse =
        makeSubsonicRequest(
            listOf("rest", "getArtists"),
            getBasicParams().asMap()
        )

    fun getArtist(id: String): InnerArtistSubsonicResponse {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<ArtistSubsonicResponse>(
            listOf("rest", "getArtist"),
            params
        ).artist
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
                ).albumList2.album
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
        ).album
    }

    fun getArtistInfo(id: String): ArtistInfo {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<ArtistInfoResponse>(
            listOf("rest", "getArtistInfo2"),
            params
        ).artistInfo2
    }

    fun getTopAlbums(type: String = "frequent", size: Int = 10): List<Album> {
        val params = getBasicParams().asMap()
        params["type"] = type
        params["size"] = size.toString()

        return makeSubsonicRequest<AlbumsResponse>(
            listOf("rest", "getAlbumList2"),
            params
        ).albumList2.album
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
        return uriBuilder.toString()
    }

    fun getRandomSongs(): List<Song> {
        val params = getBasicParams().asMap()
        params["size"] = "10"
        return makeSubsonicRequest<RandomSongsResponse>(
            listOf("rest", "getRandomSongs"),
            params
        ).randomSongs.song
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
        return uriBuilder.build().toString()
    }

    fun getSimilarSongs(id: String): List<Song> {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<SimilarSongsResponse>(
            listOf("rest", "getSimilarSongs2"),
            params
        ).similarSongs2.song
    }

    fun getSong(id: String): Song {
        val params = getBasicParams().asMap()
        params["id"] = id
        return makeSubsonicRequest<SongResponse>(
            listOf("rest", "getSong"),
            params
        ).song
    }

    fun login(username: String, password: String, url: String): Account {
        val salt = "abcd1234"
        val saltedPassword = "${password}${salt}"
        val md = MessageDigest.getInstance("MD5")
        val hash =
            BigInteger(1, md.digest(saltedPassword.toByteArray())).toString(16).padStart(32, '0')
        val basicParams = BasicParams(
            username,
            hash,
            salt,
            "1.16.1",
            "soniclair",
            "json",
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
        account = Account(username, password, url, ret.type)
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

    fun downloadPlaylist(playlist: List<Song>) {
        playlist.forEach {
            CoroutineScope(IO).launch {
                if (!File(getLocalSongUri(it.id)).exists()) {
                    if (KeyValueStorage.getSettings().cacheSize > 0) {
                        val dir = File(getSongsDirectory())
                        if (dir.exists()) {
                            val files = dir.listFiles()?.toList()
                                ?.sortedBy { file -> file.lastModified() }?.toMutableList()
                                ?: mutableListOf<File>()
                            var size = files.sumOf { it.length() }
                            while (size > KeyValueStorage.getSettings().cacheSize * (1024 * 1024)) {
                                files[0].delete()
                                files.remove(files[0])
                                size = files.sumOf { it.length() }
                            }
                        }
                    }
                    downloadSong(it.id)
                }

            }
        }
    }

}

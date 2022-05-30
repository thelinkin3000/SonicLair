package tech.logica10.soniclair

import android.media.MediaDescription
import android.media.browse.MediaBrowser
import android.net.Uri
import com.bumptech.glide.Glide
import com.getcapacitor.JSObject
import com.google.gson.Gson
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import tech.logica10.soniclair.SubsonicModels.*
import java.math.BigInteger
import java.security.MessageDigest
import java.util.concurrent.TimeUnit


class Account(val username: String?, val password: String, val url: String, var type: String)

class SubsonicClient(var account: Account) {
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

    fun getAsMediaItems(songs: List<Song>) : List<MediaBrowser.MediaItem>{
        val builder = MediaDescription.Builder()
        val ret = mutableListOf<MediaBrowser.MediaItem>()
        for (item in songs) {
            builder.setTitle(item.title)
            builder.setSubtitle(String.format("by %s", item.artist))
            val albumArtUri = Uri.parse(getAlbumArt(item.coverArt))
            val futureBitmap = Glide.with(MainActivity.context)
                .asBitmap()
                .load(albumArtUri)
                .submit()
            val albumArtBitmap = futureBitmap.get()
            builder.setIconBitmap(albumArtBitmap)
            builder.setMediaId(item.id)
            ret.add(
                MediaBrowser.MediaItem(
                    builder.build(),
                    MediaBrowser.MediaItem.FLAG_PLAYABLE
                )
            )
        }
        return ret;
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
            throw Exception("There was an error reaching the server. Please check your connection.")
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
        params.set("query", query)
        return makeSubsonicRequest<SearchResponse>(
            listOf("rest","search3"),
            params
        ).searchResult3;
    }


    fun getArtists(): ArtistsSubsonicResponse =
        makeSubsonicRequest<ArtistsSubsonicResponse>(
            listOf("rest", "getArtists"),
            getBasicParams().asMap()
        )

    fun getArtist(id: String): InnerArtistSubsonicResponse {
        val params = getBasicParams().asMap()
        params.set("id", id)
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
            params.set("type", "alphabeticalByName")
            params.set("size", "500")
            params.set("offset", (page * 500).toString())
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
        params.set("id", id)
        return makeSubsonicRequest<AlbumResponse>(
            listOf("rest", "getAlbum"),
            params
        ).album;
    }

    fun getArtistInfo(id: String): ArtistInfo{
        val params = getBasicParams().asMap()
        params.set("id", id)
        return makeSubsonicRequest<ArtistInfoResponse>(
            listOf("rest", "getArtistInfo2"),
            params
        ).artistInfo2;
    }

    fun getTopAlbums(): List<Album> {
        val params = getBasicParams().asMap()
        params.set("type", "frequent")
        params.set("size", "10")

        return makeSubsonicRequest<AlbumsResponse>(
            listOf("rest", "getAlbumList2"),
            params
        ).albumList2.album
    }

    fun getAlbumArt(id: String): String {
        val uriBuilder = Uri.parse(account.url).buildUpon()
            .appendPath("rest")
            .appendPath("getCoverArt")
        val map = this.getBasicParams().asMap()
        for (key in map.keys) {
            uriBuilder.appendQueryParameter(key, map[key])
        }
        uriBuilder.appendQueryParameter("id", id)
        return uriBuilder.build().toString()
    }

    fun getRandomSongs(): List<Song> {
        val params = getBasicParams().asMap()
        params.set("size", "10")
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
        params.set("id", id)
        return makeSubsonicRequest<SimilarSongsResponse>(
            listOf("rest", "getSimilarSongs2"),
            params
        ).similarSongs2.song
    }

    fun getSong(id: String): Song{
        val params = getBasicParams().asMap()
        params.set("id", id)
        return makeSubsonicRequest<SongResponse>(
            listOf("rest", "getSong"),
            params
        ).song;
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
        this.account = Account(username, password, url, ret.type)
        KeyValueStorage.setActiveAccount(this.account)
        val accounts = KeyValueStorage.getAccounts()
        val exists = accounts.filter { it.url == url }.size == 1
        val list: List<Account>
        if (exists) {
            list = KeyValueStorage.getAccounts().filter { it.url != url }.toMutableList()
        } else {
            list = KeyValueStorage.getAccounts().toMutableList()
        }
        list.add(this.account)
        KeyValueStorage.setAccounts(list)
        return this.account
    }

}

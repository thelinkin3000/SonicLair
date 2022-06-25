package tech.logica10.soniclair

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.net.Uri
import android.os.IBinder
import android.util.Log
import androidx.core.content.ContextCompat
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import okhttp3.*
import okhttp3.Credentials.basic
import org.json.JSONArray
import org.json.JSONException
import tech.logica10.soniclair.App.Companion.isTv
import tech.logica10.soniclair.KeyValueStorage.Companion.getAccounts
import tech.logica10.soniclair.KeyValueStorage.Companion.getActiveAccount
import tech.logica10.soniclair.KeyValueStorage.Companion.getOfflineMode
import tech.logica10.soniclair.KeyValueStorage.Companion.getSettings
import tech.logica10.soniclair.KeyValueStorage.Companion.setActiveAccount
import tech.logica10.soniclair.KeyValueStorage.Companion.setOfflineMode
import tech.logica10.soniclair.KeyValueStorage.Companion.setSettings
import tech.logica10.soniclair.models.*
import tech.logica10.soniclair.services.MusicService
import tech.logica10.soniclair.services.MusicService.LocalBinder
import java.io.IOException
import java.lang.Integer.parseInt
import java.util.concurrent.TimeUnit


@CapacitorPlugin(name = "VLC")
class BackendPlugin : Plugin(), IBroadcastObserver {
    private var registered = false
    private var gson: Gson? = null
    private var spotifyToken: String? = ""
    private var binder: LocalBinder? = null
    private var mBound = false
    private var webSocketConnected: Boolean = false
    private var mClient: OkHttpClient = OkHttpClient.Builder()
        .writeTimeout(5, TimeUnit.SECONDS)
        .readTimeout(5, TimeUnit.SECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .build()

    private var mWebSocket: WebSocket? = null

    private var lastIp: String? = null
    private var reconnect: Boolean = false

    /**
     * Defines callbacks for service binding, passed to bindService()
     */
    private val connection: ServiceConnection = object : ServiceConnection {
        override fun onServiceConnected(
            className: ComponentName,
            service: IBinder
        ) {
            // We've bound to LocalService, cast the IBinder and get LocalService instance
            Log.i("ServiceBinder", "Binding service")
            binder = service as LocalBinder
            mBound = true
        }

        override fun onServiceDisconnected(arg0: ComponentName) {
            Log.i("ServiceBinder", "Unbinding service")
            mBound = false
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        mClient.dispatcher.executorService.shutdown()
        Globals.UnregisterObserver(this)
    }

    override fun handleOnPause() {
        super.handleOnDestroy()
        Globals.UnregisterObserver(this)
        registered = false
    }

    override fun handleOnResume() {
        super.handleOnResume()
        if (!registered) {
            registered = true
            Globals.RegisterObserver(this)
        }
        if (mBound) {
            val state = binder!!.getCurrentState()
            notifyListeners("progress", JSObject("{\"time\": ${state.position}}"))
            notifyListeners(if (state.playing) "play" else "pause", null)
            notifyListeners(
                "currentTrack",
                JSObject("{\"currentTrack\": ${gson!!.toJson(state.currentTrack)}}")
            )
        }
    }

    override fun load() {
        // Set up
        if (subsonicClient == null) {
            subsonicClient = SubsonicClient(getActiveAccount())
        }
        val builder = GsonBuilder()
        builder.serializeNulls()
        gson = builder.create()
        // Bind to LocalService
        val intent = Intent(App.context, MusicService::class.java)
        App.context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        if (!registered) {
            registered = true
            Globals.RegisterObserver(this)
        }
    }

    private fun errorResponse(error: String?): JSObject {
        val ret = JSObject()
        ret.put("status", "error")
        ret.put("error", error)
        ret.put("value", null)
        return ret
    }

    @Throws(JSONException::class)
    private fun okResponse(value: Any?): JSObject {
        val ret = JSObject()
        ret.put("status", "ok")
        ret.put("error", null)
        val valueJson = gson!!.toJson(value)
        ret.put("value", JSObject(valueJson))
        return ret
    }

    @Throws(JSONException::class)
    private fun okArrayResponse(value: Any): JSObject {
        val ret = JSObject()
        ret.put("status", "ok")
        ret.put("error", null)
        val array = gson!!.toJson(value)
        val jsonarray = JSONArray(array)
        ret.put("value", jsonarray)
        return ret
    }

    private fun okResponse(value: String?): JSObject {
        val ret = JSObject()
        ret.put("status", "ok")
        ret.put("error", null)
        ret.put("value", value)
        return ret
    }

    private fun okResponse(value: Boolean): JSObject {
        val ret = JSObject()
        ret.put("status", "ok")
        ret.put("error", null)
        ret.put("value", value)
        return ret
    }

    @PluginMethod
    fun login(call: PluginCall) {
        val data = call.data
        val username = data.getString("username") ?: throw ParameterException("username")
        val password = data.getString("password") ?: throw Exception("password")
        val url = data.getString("url") ?: throw Exception("url")
        val usePlaintext = data.getBoolean("usePlaintext")
        try {
            val account = subsonicClient!!.login(
                username,
                password,
                url,
                usePlaintext
            )
            setActiveAccount(account)
            call.resolve(okResponse(account))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getCameraPermissionStatus(call: PluginCall) {
        if (ContextCompat.checkSelfPermission(
                App.context,
                "android.permission.CAMERA"
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            call.resolve(okResponse(""))
        } else {
            call.resolve(errorResponse("Please provide permission to use the camera. This is needed for the QR scanner to work."))
        }
    }

    @PluginMethod
    fun getCameraPermission(call: PluginCall) {
        if (ContextCompat.checkSelfPermission(
                App.context,
                "android.permission.CAMERA"
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            MainActivity.requestPermissionLauncher.launch("android.permission.CAMERA")
        }
        call.resolve(okResponse(""))
    }

    @PluginMethod
    fun getTopAlbums(call: PluginCall) {
        var type = call.getString("type")
        if (type == null) {
            type = "frequent"
        }
        var size = call.getInt("size")
        if (size == null) {
            size = 10
        }
        try {
            if (getOfflineMode()) {
                if (type == "newest") {
                    call.resolve(okArrayResponse(subsonicClient!!.getLocalAlbums(10, true)))
                } else {
                    call.resolve(okArrayResponse(ArrayList<Album>()))
                }
            } else {
                call.resolve(okArrayResponse(subsonicClient!!.getTopAlbums(type, size)))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getAlbums(call: PluginCall) {
        try {
            if (getOfflineMode()) {
                call.resolve(okArrayResponse(subsonicClient!!.getLocalAlbums(1000000, false)))
            } else {
                call.resolve(okArrayResponse(subsonicClient!!.getAlbums()))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getAlbum(call: PluginCall) {
        try {
            val id = call.getString("id") ?: throw ParameterException("id")
            if (getOfflineMode()) {
                call.resolve(okResponse(subsonicClient!!.getLocalAlbumWithSongs(id)))
            } else {
                call.resolve(okResponse(subsonicClient!!.getAlbum(id)))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getArtists(call: PluginCall) {
        try {
            if (getOfflineMode()) {
                call.resolve(okArrayResponse(subsonicClient!!.getLocalArtists()))
            } else {
                call.resolve(okArrayResponse(subsonicClient!!.getArtists()))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getArtist(call: PluginCall) {
        try {
            val id = call.getString("id") ?: throw ParameterException("id")
            if (getOfflineMode()) {
                call.resolve(okResponse(subsonicClient!!.getLocalArtistWithAlbums(id)))
            } else {
                call.resolve(okResponse(subsonicClient!!.getArtist(id)))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getRandomSongs(call: PluginCall) {
        try {
            if (getOfflineMode()) {
                call.resolve(okArrayResponse(object : ArrayList<Song?>() {}))
            } else {
                call.resolve(okArrayResponse(subsonicClient!!.getRandomSongs()))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getOfflineMode(call: PluginCall) {
        try {
            val ret = okResponse(getOfflineMode())
            call.resolve(ret)
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun setOfflineMode(call: PluginCall) {
        try {
            val mode = java.lang.Boolean.TRUE == call.getBoolean("value")
            setOfflineMode(mode)
            val ret = okResponse(mode)
            call.resolve(ret)
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getActiveAccount(call: PluginCall) {
        try {
            val ret = okResponse(getActiveAccount())
            call.resolve(ret)
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun setSettings(call: PluginCall) {
        try {
            val cacheSize =
                (call.getInt("cacheSize") ?: throw ParameterException("cacheSize"))
            val transcoding = call.getString("transcoding") ?: ""
            setSettings(Settings(cacheSize, transcoding))
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getSettings(call: PluginCall) {
        try {
            val ret = okResponse(getSettings())
            call.resolve(ret)
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getAccounts(call: PluginCall) {
        try {
            val ret = okArrayResponse(getAccounts())
            call.resolve(ret)
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getAlbumArt(call: PluginCall) {
        try {
            val id = call.getString("id") ?: ""
            if (getOfflineMode()) {
                call.resolve(okResponse(subsonicClient!!.getLocalAlbumArt(id)))
            } else {
                call.resolve(okResponse(subsonicClient!!.getAlbumArt(id)))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getArtistArt(call: PluginCall) {
        try {
            val id = call.getString("id") ?: throw ParameterException("id")
            if (getOfflineMode()) {
                call.resolve(okResponse(subsonicClient!!.getLocalArtistArt(id)))
            } else {
                call.resolve(okResponse(subsonicClient!!.getArtistArt(id)))
            }
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    private fun constructWebsocketCommand(command: String, data: String): WebSocketCommand {
        return WebSocketCommand(command, data)
    }

    private fun constructWebsocketMessage(data: String, status: String = "ok"): WebSocketMessage {
        return WebSocketMessage(data, "command", status)
    }

    @PluginMethod
    fun play(call: PluginCall) {
        if (webSocketConnected) {
            val command = constructWebsocketCommand("play", "")
            val message = constructWebsocketMessage(gson!!.toJson(command))
            mWebSocket!!.send(gson!!.toJson(message))
            call.resolve(okResponse(""))
            return
        }
        val intent = Intent(App.context, MusicService::class.java)
        intent.action = Constants.SERVICE_PLAY_PAUSE
        App.context.startService(intent)
        call.resolve(okResponse(""))
    }

    @PluginMethod
    fun pause(call: PluginCall) {
        if (webSocketConnected) {
            val command = constructWebsocketCommand("pause", "")
            val message = constructWebsocketMessage(gson!!.toJson(command))
            mWebSocket!!.send(gson!!.toJson(message))
            call.resolve(okResponse(""))
            return
        }
        val intent = Intent(App.context, MusicService::class.java)
        intent.action = Constants.SERVICE_PLAY_PAUSE
        App.context.startService(intent)
        call.resolve(okResponse(""))
    }

    @PluginMethod
    fun seek(call: PluginCall) {
        try {
            val value = call.getFloat("time") ?: throw ParameterException("time")
            if (webSocketConnected) {
                val command = constructWebsocketCommand("seek", value.toString())
                val message = constructWebsocketMessage(gson!!.toJson(command))
                mWebSocket!!.send(gson!!.toJson(message))
                call.resolve(okResponse(""))
                return
            }
            if (mBound) {
                binder!!.seek(value)
            }
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun setVolume(call: PluginCall) {
        try {
            if (mBound) {
                val value = call.getInt("volume", 100) ?: throw ParameterException("volume")
                binder!!.setVolume(value)
            }
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun playRadio(call: PluginCall) {
        if (getOfflineMode()) {
            call.resolve(errorResponse("Not supported in offline mode"))
            return
        }
        try {
            val id = call.getString("song") ?: throw ParameterException("song")
            if (webSocketConnected) {
                val command = constructWebsocketCommand("playRadio", id)
                val message = constructWebsocketMessage(gson!!.toJson(command))
                mWebSocket!!.send(gson!!.toJson(message))
                call.resolve(okResponse(""))
                return
            }
            if (!mBound) {
                val intent = Intent(App.context, MusicService::class.java)
                intent.action = Constants.SERVICE_PLAY_RADIO
                intent.putExtra("id", id)
                App.context.startService(intent)
            } else {
                binder!!.playRadio(id)
            }
            call.resolve(okResponse(""))
        } catch (e: NullPointerException) {
            call.resolve(errorResponse("One of the parameters was null"))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun playAlbum(call: PluginCall) {
        try {
            val id = call.getString("album") ?: throw ParameterException("album")
            val track = call.getInt("track") ?: throw ParameterException("track")
            if (webSocketConnected) {
                val command = constructWebsocketCommand("playAlbum", "$id|${track}")
                val message = constructWebsocketMessage(gson!!.toJson(command))
                mWebSocket!!.send(gson!!.toJson(message))
                call.resolve(okResponse(""))
                return
            }
            if (!mBound) {
                val intent = Intent(App.context, MusicService::class.java)
                intent.action = Constants.SERVICE_PLAY_ALBUM
                intent.putExtra("id", id)
                intent.putExtra("track", track)
                App.context.startService(intent)
            } else {
                binder!!.playAlbum(id, track)
            }
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun downloadAlbum(call: PluginCall) {
        if (getOfflineMode()) {
            call.resolve(errorResponse("Can't download albums in offline mode"))
            return
        }
        if (isTv) {
            call.resolve(errorResponse("Can't download albums in Android TV"))
            return
        }
        try {
            val id = call.getString("id") ?: throw ParameterException("id")
            val album = subsonicClient!!.getAlbum(id)
            subsonicClient!!.downloadPlaylist(album.song, true)
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun next(call: PluginCall) {
        if (webSocketConnected) {
            val command = constructWebsocketCommand("next", "")
            val message = constructWebsocketMessage(gson!!.toJson(command))
            mWebSocket!!.send(gson!!.toJson(message))
            call.resolve(okResponse(""))
            return
        }
        val intent = Intent(App.context, MusicService::class.java)
        intent.action = Constants.SERVICE_NEXT
        App.context.startService(intent)
        call.resolve(okResponse(""))
    }

    @PluginMethod
    @Throws(IOException::class)
    fun getSpotifyToken(call: PluginCall) {
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
            val client: OkHttpClient = OkHttpClient.Builder()
                .readTimeout(5000, TimeUnit.MILLISECONDS)
                .writeTimeout(5000, TimeUnit.MILLISECONDS)
                .build()
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                try {

                    val responseBody = response.body?.string()
                        ?: throw Exception("Spotify returned an empty body")

                    spotifyToken = JSObject(responseBody).getString("access_token")

                } catch (e: Exception) {
                    call.resolve(errorResponse(e.message))
                }
            } else {
                call.resolve(errorResponse(response.message))
            }
        }
        call.resolve(okResponse(spotifyToken))
    }

    @PluginMethod
    fun search(call: PluginCall) {
        try {
            val query = call.getString("query") ?: throw ParameterException("query")
            val result = subsonicClient!!.search(query)
            val ret = okResponse(result)
            call.resolve(ret)
            return
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
        call.resolve(okResponse(""))
    }

    @PluginMethod
    fun prev(call: PluginCall) {
        if (webSocketConnected) {
            val command = constructWebsocketCommand("prev", "")
            val message = constructWebsocketMessage(gson!!.toJson(command))
            mWebSocket!!.send(gson!!.toJson(message))
            call.resolve(okResponse(""))
            return
        }
        val intent = Intent(App.context, MusicService::class.java)
        intent.action = Constants.SERVICE_PREV
        App.context.startService(intent)
        call.resolve(okResponse(""))
    }

    @PluginMethod
    @Throws(JSONException::class)
    fun getCurrentState(call: PluginCall) {
        if (!mBound) {
            call.resolve(errorResponse("Music service is not yet bound"))
            return
        }
        val state = binder!!.getCurrentState()
        call.resolve(okResponse(state))
    }

    @PluginMethod
    fun getSongStatus(call: PluginCall) {
        try {
            val id = call.getString("id") ?: throw ParameterException("id")
            call.resolve(okResponse(subsonicClient!!.isCached(id)))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    private fun isIp(ip: String): Boolean {
        val splitIp = ip.split('.')
        return try {
            (splitIp.size == 4) && splitIp.all {
                parseInt(it) in 0..255
            }
        } catch (e: Exception) {
            false
        }
    }

    @PluginMethod
    fun qrLogin(call: PluginCall) {
        try {
            var ip = call.getString("ip") ?: throw ParameterException("id")
            var jukebox = false
            if (ip.endsWith('j')) {
                jukebox = true
                ip = ip.substringBefore('j')
            }
            if (!isIp(ip)) {
                call.resolve(errorResponse("The QR code is not an IP address. Please try again."))
            }
            val account = getActiveAccount()
            val jsonAccount = gson!!.toJson(account)
            val message = WebSocketMessage(jsonAccount, if (jukebox) "jukebox" else "login", "ok")
            val json = gson!!.toJson(message)
            if (webSocketConnected) {
                mWebSocket!!.close(1000, "")
            }
            try {
                connectWebSocket("ws://$ip:30001")
            } catch (e: Exception) {
                Globals.NotifyObservers("EX", "Failed to open websocket connection")
                return
            }
            mWebSocket!!.send(json)

            if (jukebox && mBound && binder!!.getCurrentState().playing) {
                val playlist = binder!!.getPlaylist()
                val request = SetPlaylistAndPlayRequest(
                    playlist,
                    playlist.entry.indexOf(binder!!.getCurrentState().currentTrack),
                    binder!!.getCurrentState().position,
                    binder!!.getCurrentState().playing
                )
                val setPlaylistCommand =
                    WebSocketCommand("setPlaylistAndPlay", gson!!.toJson(request))
                val setPlaylistMessage =
                    WebSocketMessage(gson!!.toJson(setPlaylistCommand), "command", "ok")
                mWebSocket!!.send(gson!!.toJson(setPlaylistMessage))
                binder!!.pause()
            }

            if (jukebox) {
                lastIp = ip
            } else {
                mWebSocket!!.close(1000, "")
                setWebsocketConnectionStatus(false)
            }
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }


    @PluginMethod
    fun getWebsocketStatus(call: PluginCall) {
        call.resolve(okResponse(webSocketConnected))
    }

    @PluginMethod
    fun disconnectWebsocket(call: PluginCall) {
        try {
            lastIp = null
            reconnect = false
            setWebsocketConnectionStatus(false)
            mWebSocket!!.close(1000, "")
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun sendUdpBroadcast(call: PluginCall) {
        Globals.NotifyObservers("SENDUDP", "")
        call.resolve(okResponse(""))
    }

    @PluginMethod
    fun getCurrentPlaylist(call: PluginCall) {
        if (mBound) {
            call.resolve(okResponse(binder!!.getPlaylist()))
        } else {
            call.resolve(okResponse(MusicService.getDefaultPlaylist()))
        }
    }

    @PluginMethod
    fun getPlaylists(call: PluginCall) {
        try {
            call.resolve(okArrayResponse(subsonicClient!!.getPlaylists()))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun getPlaylist(call: PluginCall) {
        try {
            val id = call.getString("id") ?: throw ParameterException("id")
            val ret = subsonicClient!!.getPlaylist(id)
            call.resolve(okResponse(ret))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun removeFromPlaylist(call: PluginCall) {
        try {
            val id: String = call.getString("id") ?: throw ParameterException("id")
            val track: Int = call.getInt("track") ?: throw ParameterException("track")
            subsonicClient!!.removeFromPlaylist(id, track)
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }

    }

    @PluginMethod
    fun addToPlaylist(call: PluginCall) {
        try {
            val id: String = call.getString("id") ?: ""
            val songId: String = call.getString("songId") ?: throw ParameterException("songId")
            if (id === "") {
                subsonicClient!!.createPlaylist(listOf(songId), "New playlist")
            } else {
                subsonicClient!!.addToPlaylist(id, songId)
            }
            call.resolve(okResponse(""))

        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun createPlaylist(call: PluginCall) {
        try {
            val name: String = call.getString("name") ?: throw ParameterException("name")
            val jsIds: JSArray = call.getArray("songId") ?: throw ParameterException("songId")
            val ids: MutableList<String> = jsIds.toList()
            val ret = subsonicClient!!.createPlaylist(ids, name)
            call.resolve(okResponse(ret))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }

    }

    @PluginMethod
    fun updatePlaylist(call: PluginCall) {
        try {
            val playlist: Playlist =
                gson!!.fromJson(call.getObject("playlist").toString(), Playlist::class.java)
            val ret = subsonicClient!!.updatePlaylist(playlist)
            call.resolve(okResponse(ret))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun removePlaylist(call: PluginCall) {
        try {
            val id = call.getString("id") ?: throw ParameterException("id")
            subsonicClient!!.removePlaylist(id)
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }

    }

    @PluginMethod
    fun skipTo(call: PluginCall) {
        try {
            val track = call.getInt("track") ?: throw ParameterException("track")
            if (webSocketConnected) {
                // We're not syncing current playlist between devices yet, so implementing
                // this is pointless. But doing anything when connected makes no sense either.
//                val command = constructWebsocketCommand("skipTo", track.toString())
//                val message = constructWebsocketMessage(gson!!.toJson(command))
//                mWebSocket!!.send(gson!!.toJson(message))
//                call.resolve(okResponse(""))
                return
            }
            if (mBound) {
                binder!!.skipTo(track)
            }
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    @PluginMethod
    fun playPlaylist(call: PluginCall) {
        try {
            val track = call.getInt("track") ?: throw ParameterException("track")
            val id = call.getString("playlist") ?: throw ParameterException("playlist")
            if (webSocketConnected) {
                val command = constructWebsocketCommand("playPlaylist", "$id|${track}")
                val message = constructWebsocketMessage(gson!!.toJson(command))
                mWebSocket!!.send(gson!!.toJson(message))
                call.resolve(okResponse(""))
                return
            }
            if (mBound) {
                binder!!.playPlaylist(id, track)
            } else {
                val intent = Intent(App.context, MusicService::class.java)
                intent.action = Constants.SERVICE_PLAY_PLAYLIST
                intent.putExtra("id", id)
                intent.putExtra("track", track)
                App.context.startService(intent)
            }
            call.resolve(okResponse(""))
        } catch (e: Exception) {
            call.resolve(errorResponse(e.message))
        }
    }

    private fun setWebsocketConnectionStatus(status: Boolean) {
        val ret = JSObject()
        ret.put("connected", status)
        webSocketConnected = status
        notifyListeners("webSocketConnection", ret)
    }

    private fun connectWebSocket(url: String) {
        val request: Request = Request.Builder().url(url).build()
        val listener = EchoWebSocketListener()
        mWebSocket = mClient.newWebSocket(request, listener)
    }

    override fun update(action: String, value: String?) {
        try {
            if (action == "SLCANCEL" && mBound) {
                App.context.unbindService(connection)
                mBound = false
                binder = null
            } else if (action.startsWith("MS")) {
                if (value != null) {
                    notifyListeners(action.replace("MS", ""), JSObject(value))
                } else {
                    notifyListeners(action.replace("MS", ""), null)
                }
            } else if (action == "EX") {
                notifyListeners("EX", JSObject("{\"error\":\"$value\"}"))
            } else if (action == "WS") {
                val ret = JSObject()
                ret.put("connected", value == "true")
                notifyListeners("webSocketConnection", ret)
            } else if (action == "RESUMED") {
                if (reconnect && lastIp != null) {
                    val account = getActiveAccount()
                    val jsonAccount = gson!!.toJson(account)
                    val message = WebSocketMessage(jsonAccount, "jukebox", "ok")
                    val json = gson!!.toJson(message)
                    if (webSocketConnected) {
                        mWebSocket!!.close(1000, "")
                    }
                    try {
                        connectWebSocket("ws://$lastIp:30001")
                    } catch (e: Exception) {
                        Globals.NotifyObservers("EX", "Failed to open websocket connection")
                        return
                    }
                    mWebSocket!!.send(json)
                    if (mBound && binder!!.getCurrentState().playing) {
                        binder!!.pause()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("SonicLair", e.message!!)
            // Frankly my dear, I couldn't care less.
        }
    }

    // Websockets handler for the client
    private inner class EchoWebSocketListener : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            setWebsocketConnectionStatus(true)
            reconnect = true
        }

        override fun onMessage(webSocket: WebSocket, text: String) {

            if (text == "soniclair") {
                webSocket.close(1000, "")
                mWebSocket = null
                setWebsocketConnectionStatus(false)
            } else {
                try {
                    val message: WebSocketMessage =
                        gson!!.fromJson(text, WebSocketMessage::class.java)
                    if (message.type == "notification") {
                        val notification =
                            gson!!.fromJson(message.data, WebSocketNotification::class.java)
                        if (notification.value != null) {
                            notifyListeners(notification.action, JSObject(notification.value))
                        } else {
                            notifyListeners(notification.action, null)
                        }
                    } else if (message.type == "message") {
                        Globals.NotifyObservers("EX", message.data)
                    } else if (message.type == "acceptedConnection") {
                        // TODO we are in, display jukebox mode on client
                        Globals.NotifyObservers("EX", "JUKEBOX MODE ON, WE ARE GO")
                    }
                } catch (e: Exception) {
                    Globals.NotifyObservers("EX", e.message)
                }
            }
        }

        override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
            webSocket.close(1000, null)
            mWebSocket = null
            setWebsocketConnectionStatus(false)
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            Globals.NotifyObservers("EX", "${t.message} ${response?.message}")
            if (mWebSocket != null) {
                try {
                    mWebSocket!!.close(1000, "")
                } catch (e: Exception) {
                    // Swallow this
                }
                setWebsocketConnectionStatus(false)
            }
        }

    }


    companion object {
        private var subsonicClient: SubsonicClient? = null
    }
}
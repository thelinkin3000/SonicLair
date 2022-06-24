package tech.logica10.soniclair

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import com.google.gson.Gson
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import tech.logica10.soniclair.App.Companion.context
import tech.logica10.soniclair.models.Account
import tech.logica10.soniclair.models.SetPlaylistAndPlayRequest
import tech.logica10.soniclair.models.WebSocketCommand
import tech.logica10.soniclair.models.WebSocketMessage
import tech.logica10.soniclair.services.MusicService
import tech.logica10.soniclair.services.MusicService.LocalBinder
import java.lang.Integer.parseInt
import java.net.InetSocketAddress
import java.nio.ByteBuffer

class MessageServer(port: Int) : WebSocketServer(InetSocketAddress(port)), IBroadcastObserver {

    private var mBound: Boolean = false
    private var binder: LocalBinder? = null

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

    init {
        Globals.RegisterObserver(this)
    }

    fun dispose(){
        Globals.UnregisterObserver(this)
    }

    private val clients: MutableList<WebSocket> = mutableListOf()

    private val gson: Gson = Gson()

    private fun constructMessage(text: String, status: String = "ok"): String {
        val message = WebSocketMessage(text, "message", status)
        return gson.toJson(message)
    }

    override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
        clients.add(conn)
        Globals.NotifyObservers("WS", "true")
        if(mBound && binder!!.getCurrentState().currentTrack.id !== ""){
            val currentTrackJson = gson.toJson(binder!!.getCurrentState().currentTrack)
            val webSocketNotification = WebSocketNotification("currentTrack", "{\"currentTrack\": $currentTrackJson}")
            val jsonNotification = gson.toJson(webSocketNotification)
            val webSocketMessage = WebSocketMessage(jsonNotification, "notification", "ok")
            val jsonMessage = gson.toJson(webSocketMessage)
            // Send the notification to everyone connected
            conn.send(jsonMessage)
        }
    }

    override fun onClose(conn: WebSocket, code: Int, reason: String?, remote: Boolean) {
        clients.remove(conn)
        if(clients.size == 0){
            Globals.NotifyObservers("WS", "false")
        }
    }

    override fun onMessage(conn: WebSocket, message: String) {
        try {
            val m = gson.fromJson(message, WebSocketMessage::class.java)
            when (m.type) {
                "login" -> {
                    Globals.NotifyObservers("WSLOGIN", m.data)
                    return
                }
                "jukebox" -> {
                    val account: Account
                    try {
                        account = gson.fromJson(m.data, Account::class.java)
                    } catch (e: Exception) {
                        conn.send(
                            constructMessage(
                                e.message!!,
                                "The payload was malformed"
                            )
                        )
                        return
                    }
                    if (account.url != KeyValueStorage.getActiveAccount().url) {
                        conn.send(
                            constructMessage(
                                "You need to be logged in to the same server on both the phone and the TV for jukebox mode to work.",
                                "error"
                            )
                        )
                    }
                    conn.send(constructMessage("You're connected! Touch the TV icon in the upper left corner to disconnect.", "ok"))
                    return
                }
                "command" -> {
                    val command = gson.fromJson(m.data, WebSocketCommand::class.java)
                    when (command.command) {
                        "play" -> if (mBound) binder!!.play()
                        "pause" -> if (mBound) binder!!.pause()
                        "next" -> if (mBound) binder!!.next()
                        "prev" -> if (mBound) binder!!.prev()
                        "playAlbum" -> {
                            val id = command.data.substringBefore('|')
                            val track = parseInt(command.data.substringAfter('|'))
                            if (id.isBlank()) {
                                conn.send(constructMessage("The parameter id is empty", "error"))
                                return
                            }
                            if (mBound) {
                                binder!!.playAlbum(id, track)
                            } else {
                                val intent = Intent(context, MusicService::class.java)
                                intent.action = Constants.SERVICE_PLAY_ALBUM
                                intent.putExtra("id", id)
                                intent.putExtra("track", track)
                                context.startService(intent)
                            }
                        }
                        "playRadio" -> {
                            if (command.data.isBlank()) {
                                conn.send(constructMessage("The parameter id is empty", "error"))
                                return
                            }
                            if (mBound) {
                                binder!!.playRadio(command.data)
                            } else {
                                val intent = Intent(context, MusicService::class.java)
                                intent.action = Constants.SERVICE_PLAY_RADIO
                                intent.putExtra("id", command.data)
                                context.startService(intent)
                            }
                        }
                        "setPlaylistAndPlay" ->{
                            if (command.data.isBlank()) {
                                conn.send(constructMessage("The parameters id is empty", "error"))
                                return
                            }
                            val request: SetPlaylistAndPlayRequest
                            try{
                                request = gson.fromJson(command.data, SetPlaylistAndPlayRequest::class.java)
                                if(request.track >= request.playlist.entry.size){
                                    throw Exception("The track parameter was out of bounds")
                                }
                            }
                            catch(e: Exception){
                                Globals.NotifyObservers("EX",e.message)
                                return
                            }

                            if (mBound) {
                                binder!!.setPlaylistAndPlay(request.playlist, request.track, request.seek, request.playing)
                            }
                        }
                        "seek" -> {
                            if (command.data.isBlank()) {
                                conn.send(constructMessage("The parameter time is empty", "error"))
                                return
                            }
                            val time = command.data.toFloatOrNull()
                            if (time == null) {
                                conn.send(
                                    constructMessage(
                                        "The parameter time is malformed",
                                        "error"
                                    )
                                )
                                return
                            }
                            if (mBound) {
                                binder!!.seek(time)
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            conn.send(
                constructMessage(
                    e.message!!,
                    "error"
                )
            )
        }
    }

    override fun onMessage(conn: WebSocket, message: ByteBuffer) {
//        broadcast(message.array())
    }

    override fun onError(conn: WebSocket?, ex: Exception) {
        ex.printStackTrace()
        Globals.NotifyObservers("EX", ex.message)
    }

    override fun onStart() {
        connectionLostTimeout = 0
        connectionLostTimeout = 100

        // Bind to the music service
        val intent = Intent(context, MusicService::class.java)
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    override fun update(action: String?, value: String?) {
        if (action == "SLCANCEL") {
            if (mBound) {
                context.unbindService(connection)
                mBound = false
                binder = null
            }
        } else if (action != null && action.startsWith("MS")) {
            val webSocketNotification = WebSocketNotification(action.replace("MS", ""), value)
            val jsonNotification = gson.toJson(webSocketNotification)
            val webSocketMessage = WebSocketMessage(jsonNotification, "notification", "ok")
            val jsonMessage = gson.toJson(webSocketMessage)
            // Send the notification to everyone connected
            broadcast(jsonMessage)
        }
    }
}


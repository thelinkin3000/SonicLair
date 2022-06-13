package tech.logica10.soniclair

import com.getcapacitor.JSObject
import com.google.gson.Gson
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import java.net.InetSocketAddress
import java.nio.ByteBuffer
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class WebSocketMessage(
    val data: String,
    val type: String
)

class MessageServer : WebSocketServer {
    private val clients: MutableMap<String, WebSocket> = ConcurrentHashMap()
    private val gson: Gson = Gson()

    constructor(port: Int) : super(InetSocketAddress(port))

    private fun constructMessage(text: String): String {
        val message = WebSocketMessage(text, "message")
        return gson.toJson(message)
    }

    override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {
        val uniqueID: String = UUID.randomUUID().toString()
        clients[uniqueID] = conn
        conn.send(constructMessage("soniclair"))
    }

    override fun onClose(conn: WebSocket, code: Int, reason: String?, remote: Boolean) {

    }

    override fun onMessage(conn: WebSocket, message: String) {
        try {
            val m = JSObject(message)
            if (m.has("type") && m.getString("type") == "login") {
                Globals.NotifyObservers("WSLOGIN", m.getJSObject("data").toString())
            }

        } catch (e: Exception) {
            return
        }
    }

    override fun onMessage(conn: WebSocket, message: ByteBuffer) {
//        broadcast(message.array())
    }

    override fun onError(conn: WebSocket?, ex: Exception) {
        ex.printStackTrace()
//        if (conn != null) {
//            // some errors like port binding failed may not be assignable to a specific websocket
//        }
    }

    override fun onStart() {
        connectionLostTimeout = 0
        connectionLostTimeout = 100
    }
}
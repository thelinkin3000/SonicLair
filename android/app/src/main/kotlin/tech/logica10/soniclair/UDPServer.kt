package tech.logica10.soniclair

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

class UDPServer(
    val ipAddress: InetAddress,
    private val broadcastAddress: InetAddress,
    val server: Boolean
) : IBroadcastObserver {
    private var broadcastSocket: DatagramSocket? = null
    private var receving: Boolean = false

    init {
        try {

            broadcastSocket = DatagramSocket(30002, InetAddress.getByName("0.0.0.0"))
            broadcastSocket!!.broadcast = true

            Globals.RegisterObserver(this)
        } catch (e: Exception) {
            broadcastSocket = null
            Globals.NotifyObservers("EX", "Couldn't start UDP Server")
        }
    }

    fun close() {
        if (broadcastSocket != null) {
            broadcastSocket!!.close()
        }
        Globals.UnregisterObserver(this)
    }

    private fun sendUDP() {
        if (broadcastSocket == null) {
            return
        }
        // Send it and forget it
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val packet = DatagramPacket("soniclairClient".toByteArray(Charsets.UTF_8), "soniclairClient".toByteArray(Charsets.UTF_8).size, broadcastAddress, 30002)
                @Suppress("BlockingMethodInNonBlockingContext")
                broadcastSocket!!.send(packet)
            } catch (e: Exception) {
                Globals.NotifyObservers("EX", e.message)
            }
        }
    }

    fun receiveUDP() {
        if (broadcastSocket == null || receving) {
            return
        }
        try {
            Log.i("SonicLair UDP", "Starting receiver")
            val buffer = ByteArray(1500)
            val packet = DatagramPacket(buffer, buffer.size)
            receving = true
            broadcastSocket!!.receive(packet)
            receving = false
            if(packet.address == ipAddress){
                receiveUDP()
                return
            }
            Log.i("SonicLair UDP", "Packet received")
            var realLength = packet.length
            while(packet.data[realLength].toInt() == 0){
                realLength--
            }

            if (String(packet.data, 0, realLength + 1, Charsets.UTF_8).replace("\n","") == "soniclairClient" && server) {
                val responsePacket = DatagramPacket("soniclairServer".toByteArray(Charsets.UTF_8), "soniclairServer".toByteArray(Charsets.UTF_8).size,broadcastAddress, 30002)
                broadcastSocket!!.send(responsePacket)
            } else if (String(packet.data,0, realLength + 1, Charsets.UTF_8).replace("\n","") == "soniclairServer" && !server){
                if (packet.address.hostAddress != null && packet.address.hostAddress!!.isNotBlank()) {
                    Globals.NotifyObservers("MStvPacket","{\"ip\":\"${packet.address.hostAddress}\"}")
                }
            }
            if (server) {
                // If we want to actively listen to incoming packets
                CoroutineScope(Dispatchers.IO).launch {
                    // Let's keep listening for another packet
                    receiveUDP()
                }
            }
        } catch (e: Exception) {
            // We let the front-end know
            Globals.NotifyObservers("EX", e.message)
        }
    }

    override fun update(action: String?, value: String?) {
        if (action == "SENDUDP") {
            CoroutineScope(Dispatchers.IO).launch {
                receiveUDP()
            }
            sendUDP()
        }
    }
}
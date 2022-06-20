package tech.logica10.soniclair

import android.app.Application
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.InetAddress
import java.net.InterfaceAddress
import java.net.NetworkInterface
import java.util.*

class App : Application() {
    private var udpServer: UDPServer? = null

    override fun onCreate() {
        super.onCreate()
        application = this
        CoroutineScope(Dispatchers.IO).launch {
            // If we're logged in a server
            if (KeyValueStorage.getActiveAccount().username != null) {
                val songs = KeyValueStorage.getCachedSongs()
                // If we don't already have cached items
                if (songs.isEmpty()) {
                    // Repopulate the media items cache
                    val subsonicClient = SubsonicClient(KeyValueStorage.getActiveAccount())
                    val s = subsonicClient.getRandomSongs()
                    KeyValueStorage.setCachedSongs(s)
                }
            }
            return@launch
        }
        val uiModeManager: UiModeManager =
            this.applicationContext.getSystemService(UI_MODE_SERVICE) as UiModeManager

        if (uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION) {
            isTv = true

        }
        try {
            val interfaces: List<NetworkInterface> =
                Collections.list(NetworkInterface.getNetworkInterfaces())
            for (intf in interfaces) {
                if (intf.name.subSequence(
                        0,
                        2
                    ) == "rm" || (intf.name.length >= 6 && intf.name.subSequence(
                        0,
                        5
                    ) == "radio")
                ) {
                    continue
                }
                val addrs: MutableList<InterfaceAddress> = intf.interfaceAddresses
                for (addr in addrs) {
                    val a: String = addr.address.hostAddress!!.replace("/", "")
                    if (!addr.address.isLoopbackAddress
                        && (a.subSequence(0, 7) == "192.168"
                                || a.subSequence(0, 2) == "10"
                                || a.subSequence(0, 3) == "172")
                    ) {
                        localIp = a
                        localBroadcast = addr.broadcast.hostAddress!!
                    }
                }
            }

        } catch (ex: Exception) {
            Log.e("SonicLair", ex.message!!)
        } // for now eat exceptions

        udpServer = UDPServer(
            InetAddress.getByName(localIp),
            InetAddress.getByName(localBroadcast),
            isTv
        )
        if (isTv) {
            server = MessageServer(30001)
            server!!.start()
            CoroutineScope(Dispatchers.IO).launch {

                udpServer!!.receiveUDP()
            }
        }
    }

    companion object {
        var application: Application? = null
            private set

        @JvmStatic
        val context: Context
            get() = application!!.applicationContext
        var localIp: String? = null
        var localBroadcast: String? = null
        var server: MessageServer? = null
        var isTv: Boolean = false
    }
}
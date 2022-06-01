package tech.logica10.soniclair

import android.app.Application
import android.app.UiModeManager
import android.content.Context
import android.content.res.Configuration
import android.os.Debug
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.InetAddress
import java.net.NetworkInterface
import java.util.*

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        Debug.waitForDebugger()
        application = this
        CoroutineScope(Dispatchers.IO).launch {
            // If we're logged in a server
            if(KeyValueStorage.getActiveAccount().username != null) {
                val songs = KeyValueStorage.getCachedSongs()
                // If we don't already have cached items
                if (songs.isEmpty()) {
                    // Repopulate the media items cache
                    val subsonicClient = SubsonicClient(KeyValueStorage.getActiveAccount())
                    val s = subsonicClient.getRandomSongs()
                    KeyValueStorage.setCachedSongs(songs)
                }
            }
            return@launch
        }
        val uiModeManager: UiModeManager =
            this.applicationContext.getSystemService(UI_MODE_SERVICE) as UiModeManager;
        if (uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION) {
            try {
                val interfaces: List<NetworkInterface> =
                    Collections.list(NetworkInterface.getNetworkInterfaces())
                for (intf in interfaces) {
                    if(intf.name.subSequence(0,2) == "rm" || intf.name.subSequence(0,5) == "radio"){
                        continue;
                    }
                    val addrs: List<InetAddress> = Collections.list(intf.getInetAddresses())
                    for (addr in addrs) {
                        if (!addr.isLoopbackAddress()
                            && (addr.hostAddress.subSequence(0,7) == "192.168"
                                    || addr.hostAddress.subSequence(0,2) == "10"
                                    || addr.hostAddress.subSequence(0,3) == "172")) {
                            pairString = "SONICLAIRIP:${addr.hostAddress.toString()}"
                        }
                    }
                }
            } catch (ex: Exception) {
            } // for now eat exceptions
        }
    }

    companion object {
        var application: Application? = null
            private set
        @JvmStatic
        val context: Context
            get() = application!!.applicationContext
        var pairString: String? = null;
    }
}
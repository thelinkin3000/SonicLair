package tech.logica10.soniclair

import android.app.Application
import android.content.Context
import android.os.Debug
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

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
    }

    companion object {
        var application: Application? = null
            private set
        @JvmStatic
        val context: Context
            get() = application!!.applicationContext
    }
}
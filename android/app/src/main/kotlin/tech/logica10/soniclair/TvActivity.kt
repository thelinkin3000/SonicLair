package tech.logica10.soniclair

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import android.widget.Button
import tech.logica10.soniclair.fragments.HomeFragment
import tech.logica10.soniclair.fragments.JukeboxFragment
import tech.logica10.soniclair.fragments.NowPlayingFragment
import tech.logica10.soniclair.fragments.SearchFragment
import tech.logica10.soniclair.models.Playlist
import tech.logica10.soniclair.services.MusicService

class TvActivity : AppCompatActivity() {
    private val client: SubsonicClient = SubsonicClient(KeyValueStorage.getActiveAccount())
    private val _homeFragment: HomeFragment = HomeFragment(this.TvActivityBind(), client)
    private val _playingFragment: NowPlayingFragment =
        NowPlayingFragment(this.TvActivityBind(), client)
    private val _jukeboxFragment: JukeboxFragment = JukeboxFragment()
    private val _searchFragment: SearchFragment= SearchFragment(client, this.TvActivityBind())
    private var binder: MusicService.LocalBinder? = null
    private var mBound = false
    private val connection: ServiceConnection = object : ServiceConnection {
        override fun onServiceConnected(
            className: ComponentName,
            service: IBinder
        ) {
            // We've bound to LocalService, cast the IBinder and get LocalService instance
            Log.i("ServiceBinder", "Binding service")
            binder = service as MusicService.LocalBinder
            mBound = true
        }

        override fun onServiceDisconnected(arg0: ComponentName) {
            Log.i("ServiceBinder", "Unbinding service")
            mBound = false
        }
    }

    inner class TvActivityBind {
        fun getCurrentState(): CurrentState? {
            if (mBound) {
                return binder!!.getCurrentState()
            }
            return null
        }

        fun getCurrentPlaylist(): Playlist? {
            if (mBound) {
                return binder!!.getPlaylist()
            }
            return null
        }

        fun playAlbum(id: String, track: Int) {
            if (mBound) {
                binder!!.playAlbum(id, track)
            } else {
                val intent = Intent(App.context, MusicService::class.java)
                intent.action = Constants.SERVICE_PLAY_ALBUM
                intent.putExtra("id", id)
                intent.putExtra("track", track)
                App.context.startService(intent)
            }
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _playingFragment)
                .commit()
        }

        fun playRadio(id: String) {
            if (mBound) {
                binder!!.playRadio(id)
            } else {
                val intent = Intent(App.context, MusicService::class.java)
                intent.action = Constants.SERVICE_PLAY_RADIO
                intent.putExtra("id", id)
                App.context.startService(intent)
            }
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _playingFragment)
                .commit()
        }

        fun playPause() {
            if (mBound) {
                if (binder!!.getCurrentState().playing) {
                    binder!!.pause()
                } else {
                    binder!!.play()
                }
            }
        }

        fun next() {
            if (mBound) {
                binder!!.next()
            }
        }

        fun prev() {
            if (mBound) {
                binder!!.prev()
            }
        }

    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tv)
        supportActionBar?.hide()
        supportFragmentManager
            .beginTransaction()
            .replace(R.id.fg_container, _homeFragment)
            .commit()
        // Bind to LocalService
        val intent = Intent(App.context, MusicService::class.java)
        App.context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        val homeButton: Button = findViewById(R.id.btn_home)
        homeButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _homeFragment)
                .commit()
        }
        val playingButton: Button = findViewById(R.id.btn_playing)
        playingButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _playingFragment)
                .commit()
        }
        val jukeboxButton: Button = findViewById(R.id.btn_jukebox)
        jukeboxButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _jukeboxFragment)
                .commit()
        }
        val searchButton: Button = findViewById(R.id.btn_search)
        searchButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _searchFragment)
                .commit()
        }
    }


}
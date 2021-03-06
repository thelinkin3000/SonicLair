package tech.logica10.soniclair

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import tech.logica10.soniclair.fragments.*
import tech.logica10.soniclair.models.Playlist
import tech.logica10.soniclair.services.MusicService

class TvActivity : AppCompatActivity() {
    private val client: SubsonicClient = SubsonicClient(KeyValueStorage.getActiveAccount())
    private val _homeFragment: HomeFragment = HomeFragment(this.TvActivityBind(), client)
    private val _playingFragment: NowPlayingFragment =
        NowPlayingFragment(this.TvActivityBind(), client)
    private val _jukeboxFragment: JukeboxFragment = JukeboxFragment()
    private val _searchFragment: SearchFragment = SearchFragment(client, this.TvActivityBind())
    private val _playlistFragment: PlaylistsFragment =
        PlaylistsFragment(client, this.TvActivityBind())
    private val _accountFragment: AccountFragment = AccountFragment()
    private lateinit var phoneConnected: ImageView
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

    override fun onBackPressed() {
        val count = supportFragmentManager.backStackEntryCount
        if (count == 0) {
            super.onBackPressed()
            //additional code
        } else {
            supportFragmentManager.popBackStack()
        }
    }

    inner class TvActivityObserver : IBroadcastObserver {
        override fun update(action: String?, value: String?) {
            if (action == "WS") {
                this@TvActivity.runOnUiThread {
                phoneConnected.visibility = if (value == "true") View.VISIBLE else View.INVISIBLE

                }
            }
            if (action == "EX") {
                Toast.makeText(this@TvActivity, value, Toast.LENGTH_SHORT).show()
            }
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
                CoroutineScope(Dispatchers.IO).launch {
                    binder!!.playAlbum(id, track)
                }
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
                .addToBackStack(null)

                .commit()
        }

        fun shuffle(){
            if(mBound){
                binder!!.shuffle()
            }
        }

        fun playRadio(id: String) {
            if (mBound) {
                CoroutineScope(Dispatchers.IO).launch {
                    binder!!.playRadio(id)
                }
            } else {
                val intent = Intent(App.context, MusicService::class.java)
                intent.action = Constants.SERVICE_PLAY_RADIO
                intent.putExtra("id", id)
                App.context.startService(intent)
            }
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _playingFragment)
                .addToBackStack(null)

                .commit()
        }

        fun playPlaylist(id: String, track: Int) {
            if (mBound) {
                CoroutineScope(Dispatchers.IO).launch {
                    binder!!.playPlaylist(id, track)
                }
            } else {
                val intent = Intent(App.context, MusicService::class.java)
                intent.action = Constants.SERVICE_PLAY_PLAYLIST
                intent.putExtra("id", id)
                intent.putExtra("track", track)
                App.context.startService(intent)
            }
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _playingFragment)
                .addToBackStack(null)

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
            .addToBackStack(null)
            .commit()
        // Bind to LocalService
        val intent = Intent(App.context, MusicService::class.java)
        App.context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        Globals.RegisterObserver(this.TvActivityObserver())
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        phoneConnected = findViewById(R.id.iv_phone_connected)
        val homeButton: Button = findViewById(R.id.btn_home)
        homeButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _homeFragment)
                .addToBackStack(null)

                .commit()
        }
        val playingButton: Button = findViewById(R.id.btn_playing)
        playingButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _playingFragment)
                .addToBackStack(null)

                .commit()
        }
        val jukeboxButton: Button = findViewById(R.id.btn_jukebox)
        jukeboxButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _jukeboxFragment)
                .addToBackStack(null)

                .commit()
        }
        val searchButton: Button = findViewById(R.id.btn_search)
        searchButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _searchFragment)
                .addToBackStack(null)

                .commit()
        }
        val playlistsButton: Button = findViewById(R.id.btn_playlists)
        playlistsButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _playlistFragment)
                .addToBackStack(null)

                .commit()
        }
        val accountButton: Button = findViewById(R.id.btn_account)
        accountButton.setOnClickListener {
            supportFragmentManager
                .beginTransaction()
                .replace(R.id.fg_container, _accountFragment)
                .addToBackStack(null)

                .commit()
        }
    }


}
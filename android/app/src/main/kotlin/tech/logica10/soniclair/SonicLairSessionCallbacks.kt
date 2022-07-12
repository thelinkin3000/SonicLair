package tech.logica10.soniclair

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import android.support.v4.media.session.MediaSessionCompat
import android.util.Log
import android.view.KeyEvent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import tech.logica10.soniclair.services.MusicService

class SonicLairSessionCallbacks : MediaSessionCompat.Callback() {
    private var mBound = false
    private var binder: MusicService.LocalBinder? = null

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

    init {
        // Bind to LocalService
        val intent = Intent(App.context, MusicService::class.java)
        App.context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    override fun onPlay() {
        super.onPlay()
        if (mBound) {
            binder!!.play()
        }
    }

    override fun onPause() {
        super.onPause()
        if (mBound) {
            binder!!.pause()
        }
    }

    override fun onSkipToNext() {
        super.onSkipToNext()
        if (mBound) {
            binder!!.next()
        }
    }

    override fun onSkipToPrevious() {
        super.onSkipToPrevious()
        if (mBound) {
            binder!!.prev()
        }
    }

    override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {
        val ke = mediaButtonIntent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT)
        if (ke != null && ke.action == KeyEvent.ACTION_DOWN) {
            when (ke.keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.KEYCODE_MEDIA_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                    if (mBound) {
                        binder!!.playpause()
                    }
                }
                KeyEvent.KEYCODE_MEDIA_NEXT -> {
                    if (mBound) {
                        binder!!.next()
                    }
                }
                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                    if (mBound) {
                        binder!!.prev()
                    }
                }
            }
        }
        return true
    }

    override fun onPlayFromMediaId(mediaId: String, extras: Bundle) {

        val id = mediaId.subSequence(1, mediaId.length).toString()
        CoroutineScope(Dispatchers.IO).launch{
            when (mediaId.subSequence(0, 1)) {
                "s" -> {
                    if (mBound) {
                        binder!!.playRadio(id)
                    } else {
                        val intent = Intent(App.context, MusicService::class.java)
                        intent.action = Constants.SERVICE_PLAY_RADIO
                        intent.putExtra("id", id)
                        App.context.startService(intent)
                    }
                }
                "a" -> {
                    if (mBound) {
                        binder!!.playAlbum(id, 0)
                    } else {
                        val intent = Intent(App.context, MusicService::class.java)
                        intent.action = Constants.SERVICE_PLAY_ALBUM
                        intent.putExtra("id", id)
                        intent.putExtra("track", 0)
                        App.context.startService(intent)
                    }
                }
                "p" -> {
                    if (mBound) {
                        binder!!.playPlaylist(id, 0)
                    } else{
                        val intent = Intent(App.context, MusicService::class.java)
                        intent.action = Constants.SERVICE_PLAY_PLAYLIST
                        intent.putExtra("id", id)
                        intent.putExtra("track", 0)
                        App.context.startService(intent)
                    }
                }
            }
        }

    }

    override fun onPlayFromSearch(query: String?, extras: Bundle?) {
        if (query != null && query.isNotEmpty()) {
            Globals.NotifyObservers("SLPLAYSEARCH", query)
            return
        }
        Globals.NotifyObservers("SLPLAY", "")
    }
}
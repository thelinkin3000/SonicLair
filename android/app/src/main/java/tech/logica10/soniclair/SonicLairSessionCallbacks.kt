package tech.logica10.soniclair

import android.media.session.MediaSession
import tech.logica10.soniclair.Globals
import android.content.Intent
import android.os.Bundle
import android.support.v4.media.session.MediaSessionCompat
import android.view.KeyEvent

class SonicLairSessionCallbacks : MediaSessionCompat.Callback() {
    override fun onPlay() {
        super.onPlay()
        Globals.NotifyObservers("SLPAUSE", null)
    }

    override fun onPause() {
        super.onPause()
        Globals.NotifyObservers("SLPAUSE", null)
    }

    override fun onSkipToNext() {
        super.onSkipToNext()
        Globals.NotifyObservers("SLNEXT", null)
    }

    override fun onSkipToPrevious() {
        super.onSkipToPrevious()
        Globals.NotifyObservers("SLPREV", null)
    }

    override fun onMediaButtonEvent(mediaButtonIntent: Intent): Boolean {
        val ke = mediaButtonIntent.getParcelableExtra<KeyEvent>(Intent.EXTRA_KEY_EVENT)
        if (ke != null && ke.action == KeyEvent.ACTION_DOWN) {
            when (ke.keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY, KeyEvent.KEYCODE_MEDIA_PAUSE, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                    Globals.NotifyObservers("SLPAUSE", null)
                }
                KeyEvent.KEYCODE_MEDIA_NEXT -> {
                    Globals.NotifyObservers("SLNEXT", null)
                }
                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                    Globals.NotifyObservers("SLPREV", null)
                }
            }
        }
        return true
    }

    override fun onPlayFromMediaId(mediaId: String, extras: Bundle) {
        Globals.NotifyObservers("SLPLAYID", mediaId)
    }
}
package tech.logica10.soniclair

import android.net.Uri
import android.os.Bundle
import android.support.v4.media.session.MediaSessionCompat

class MediaCallbacks : MediaSessionCompat.Callback() {
    override fun onPlay() {
        Globals.NotifyObservers("SLPLAY", "")
    }

    override fun onPlayFromSearch(query: String?, extras: Bundle?) {
        if (query != null && query.isNotEmpty()) {
            Globals.NotifyObservers("SLPLAYSEARCH", query)
            return
        }
        Globals.NotifyObservers("SLPLAY", "")
    }

    override fun onPlayFromUri(uri: Uri?, extras: Bundle?) {
        super.onPlayFromUri(uri, extras)
    }

    override fun onPause() {
        Globals.NotifyObservers("SLPAUSE", "")
    }

    override fun onSkipToNext() {
        Globals.NotifyObservers("SLNEXT", "")
    }

    override fun onSkipToPrevious() {
        Globals.NotifyObservers("SLPREV", "")
    }
}
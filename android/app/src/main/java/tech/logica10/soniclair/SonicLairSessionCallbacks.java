package tech.logica10.soniclair;

import android.content.Intent;
import android.media.session.MediaSession;
import android.view.KeyEvent;

public class SonicLairSessionCallbacks extends MediaSession.Callback {
    @Override
    public void onPlay() {
        super.onPlay();
        Globals.NotifyObservers("SLPAUSE");
    }

    public void onPause() {
        super.onPause();
        Globals.NotifyObservers("SLPAUSE");
    }

    @Override
    public void onSkipToNext() {
        super.onSkipToNext();
        Globals.NotifyObservers("SLNEXT");
    }

    @Override
    public void onSkipToPrevious() {
        super.onSkipToPrevious();
        Globals.NotifyObservers("SLPREV");
    }

    @Override
    public boolean onMediaButtonEvent(Intent mediaButtonIntent){
        KeyEvent ke = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
        if (ke != null && ke.getAction() == KeyEvent.ACTION_DOWN) {
            int keyCode = ke.getKeyCode();
            if(keyCode == KeyEvent.KEYCODE_MEDIA_PLAY || keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE){
                Globals.NotifyObservers("SLPAUSE");
            }
            else if(keyCode == KeyEvent.KEYCODE_MEDIA_NEXT){
                Globals.NotifyObservers("SLNEXT");
            }
            else if(keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS){
                Globals.NotifyObservers("SLPREV");
            }
        }
        return true;
    }
}
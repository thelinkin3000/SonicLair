package tech.logica10.soniclair;

import static androidx.media.MediaBrowserServiceCompatApi21.setSessionToken;

import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.media.MediaMetadata;
import android.media.browse.MediaBrowser.MediaItem;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Bundle;
import android.service.media.MediaBrowserService;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.cast.framework.MediaNotificationManager;

@CapacitorPlugin(name = "MediaSession")
public class MediaSessionPlugin extends Plugin {

    private MediaSession mediaSession = null;
    private MediaMetadata.Builder metadataBuilder = null;
    private PlaybackState stateCompat = null;
    private PlaybackState.Builder stateBuilder = null;
    @Override
    public void load(){
        mediaSession = new MediaSession(MainActivity.context, "SonicLair");
        mediaSession.setFlags(
                MediaSession.FLAG_HANDLES_MEDIA_BUTTONS |
                        MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        // Set an initial PlaybackState with ACTION_PLAY, so media buttons can start the player
        stateBuilder = new PlaybackState.Builder()
                .setActions(
                        PlaybackState.ACTION_PLAY |
                                PlaybackState.ACTION_PLAY_PAUSE);
        mediaSession.setPlaybackState(stateBuilder.build());
        // MySessionCallback() has methods that handle callbacks from a media controller
        mediaSession.setCallback(new MySessionCallback());
        final MediaNotificationManager mediaNotificationManager = new MediaNotificationManager();
        setSessionToken(mediaSession.getSessionToken());
        metadataBuilder = new MediaMetadata.Builder();

    }

    @PluginMethod()
    public void play(PluginCall call){
        stateBuilder.setState(PlaybackStateCompat.STATE_PLAYING, 0,1);
        mediaSession.setPlaybackState(stateBuilder.build());
        mediaSession.setActive(true);
        call.resolve();
    }

    @PluginMethod()
    public void updateMedia(PluginCall call) {
        JSObject ret = new JSObject();
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM, call.getString("album"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI, call.getString("albumImage"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST, call.getString("artist"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ARTIST, call.getString("artist"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_TITLE, call.getString("song"));
        mediaSession.setMetadata(metadataBuilder.build());
        ret.put("status", "ok");
        call.resolve(ret);
    }


    private class MySessionCallback extends MediaSession.Callback {
        @Override
        public void onPlay(){

        }

    }
}
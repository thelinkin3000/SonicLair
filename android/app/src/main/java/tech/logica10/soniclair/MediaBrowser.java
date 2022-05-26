package tech.logica10.soniclair;

import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Bundle;
import android.service.media.MediaBrowserService;
import android.text.TextUtils;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;

public class MediaBrowser extends MediaBrowserService {
    private static final String MY_MEDIA_ROOT_ID = "media_root_id";
    private static final String MY_EMPTY_MEDIA_ROOT_ID = "empty_root_id";

    private MediaSession mediaSession;
    private PlaybackState.Builder stateBuilder;

    @Override
    public void onCreate() {
        super.onCreate();

        // Create a MediaSessionCompat
        mediaSession = new MediaSession(MainActivity.context, "SONICLAIR");

//        // Set an initial PlaybackState with ACTION_PLAY, so media buttons can start the player
//        stateBuilder = new PlaybackState.Builder()
//                .setActions(
//                        PlaybackStateCompat.ACTION_PLAY |
//                                PlaybackStateCompat.ACTION_PLAY_PAUSE);
        mediaSession.setPlaybackState(stateBuilder.build());

        // MySessionCallback() has methods that handle callbacks from a media controller
        mediaSession.setCallback(new SonicLairSessionCallbacks());

        // Set the session's token so that client activities can communicate with it.
        setSessionToken(mediaSession.getSessionToken());
    }

    @Nullable
    @Override
    public BrowserRoot onGetRoot(@NonNull String clientPackageName, int clientUid, @Nullable Bundle rootHints) {
        return new BrowserRoot("sonicLairRoot",null);
    }

    @Override
    public void onLoadChildren(@NonNull String parentMediaId, @NonNull Result<List<android.media.browse.MediaBrowser.MediaItem>> result) {
            // Assume for example that the music catalog is already loaded/cached.
            List<android.media.browse.MediaBrowser.MediaItem> mediaItems = Globals.GetMediaItems();
            result.sendResult(mediaItems);
    }
}

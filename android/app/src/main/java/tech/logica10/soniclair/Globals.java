package tech.logica10.soniclair;

import android.media.browse.MediaBrowser;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.support.v4.media.MediaBrowserCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.MediaSessionCompat.Callback;
import android.support.v4.media.session.PlaybackStateCompat;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

public class Globals{
    // Static variable reference of single_instance
    // of type Singleton
    private static Globals single_instance = null;

    // Declaring a variable of type String
    private final List<IBroadcastObserver> observers;
    private ArrayList<MediaBrowserCompat.MediaItem> mediaItems;
    private MediaSessionCompat mediaSession;

    // Constructor
    // Here we will be creating private constructor
    // restricted to this class itself
    private Globals()
    {
        mediaItems = new ArrayList<MediaBrowserCompat.MediaItem>();
        observers = new ArrayList<IBroadcastObserver>();
        // Create a media session. NotificationCompat.MediaStyle
        // PlayerService is your own Service or Activity responsible for media playback.
        mediaSession = new MediaSessionCompat(App.getContext(), "Soniclair");
        mediaSession.setCallback(new SonicLairSessionCallbacks());
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder();
        stateBuilder.setState(PlaybackStateCompat.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1);
        stateBuilder.setActions(PlaybackStateCompat.ACTION_PLAY_PAUSE |  PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS);
        mediaSession.setPlaybackState(stateBuilder.build());
        mediaSession.setCallback(new MediaCallbacks());
    }

    // Static method
    // Static method to create instance of Singleton class
    public static Globals getInstance()
    {
        if (single_instance == null)
            single_instance = new Globals();

        return single_instance;
    }

    public static void RegisterObserver(IBroadcastObserver observer){
        getInstance().observers.add(observer);
    }

    public static void UnregisterObserver(IBroadcastObserver observer){
        getInstance().observers.remove(observer);
    }

    public static void NotifyObservers(String action, String value) {
        for (IBroadcastObserver observer : getInstance().observers) {
            observer.update(action, value);
        }
    }

    public static ArrayList<MediaBrowserCompat.MediaItem> GetMediaItems(){
        return getInstance().mediaItems;
    }

    public static void SetMediaItems(ArrayList<MediaBrowserCompat.MediaItem> mediaItemArray) {
        getInstance().mediaItems = mediaItemArray;
    }

    public static void SetMediaSession(MediaSessionCompat mediaSession){
        getInstance().mediaSession = mediaSession;
    }

    public static MediaSessionCompat GetMediaSession(){
        return getInstance().mediaSession;
    }
}

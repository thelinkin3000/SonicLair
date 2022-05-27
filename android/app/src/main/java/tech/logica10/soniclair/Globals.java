package tech.logica10.soniclair;

import android.media.browse.MediaBrowser;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;

import java.util.ArrayList;
import java.util.List;

public class Globals {
    // Static variable reference of single_instance
    // of type Singleton
    private static Globals single_instance = null;

    // Declaring a variable of type String
    private List<IBroadcastObserver> observers;
    private ArrayList<MediaBrowser.MediaItem> mediaItems;
    private MediaSession mediaSession;

    // Constructor
    // Here we will be creating private constructor
    // restricted to this class itself
    private Globals()
    {
        mediaItems = new ArrayList<MediaBrowser.MediaItem>();
        observers = new ArrayList<IBroadcastObserver>();
        // Create a media session. NotificationCompat.MediaStyle
        // PlayerService is your own Service or Activity responsible for media playback.
        mediaSession = new MediaSession(MainActivity.context, "Soniclair");
        mediaSession.setCallback(new SonicLairSessionCallbacks());
        PlaybackState.Builder stateBuilder = new PlaybackState.Builder();
        stateBuilder.setState(PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1);
        stateBuilder.setActions(PlaybackState.ACTION_PLAY_PAUSE |  PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS);
        mediaSession.setPlaybackState(stateBuilder.build());

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

    public static void NotifyObservers(String action, String value){
        for (IBroadcastObserver observer : getInstance().observers) {
            observer.update(action, value);
        }
    }

    public static ArrayList<MediaBrowser.MediaItem> GetMediaItems(){
        return getInstance().mediaItems;
    }

    public static void SetMediaItems(ArrayList<MediaBrowser.MediaItem> mediaItemArray) {
        getInstance().mediaItems = mediaItemArray;
    }

    public static void SetMediaSession(MediaSession mediaSession){
        getInstance().mediaSession = mediaSession;
    }

    public static MediaSession GetMediaSession(){
        return getInstance().mediaSession;
    }
}

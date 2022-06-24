package tech.logica10.soniclair;

import android.media.session.PlaybackState;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;

public class Globals{
    // Static variable reference of single_instance
    // of type Singleton
    private static Globals single_instance = null;

    // Declaring a variable of type String
    private final List<IBroadcastObserver> observers;
    private final MediaSessionCompat mediaSession;

    // Constructor
    // Here we will be creating private constructor
    // restricted to this class itself
    private Globals()
    {
        observers = new ArrayList<>();
        // Create a media session. NotificationCompat.MediaStyle
        // PlayerService is your own Service or Activity responsible for media playback.
        mediaSession = new MediaSessionCompat(App.getContext(), "Soniclair");
        mediaSession.setCallback(new SonicLairSessionCallbacks());
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder();
        stateBuilder.setState(PlaybackStateCompat.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1);
        stateBuilder.setActions(PlaybackStateCompat.ACTION_PLAY_PAUSE |  PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS);
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

    public static void UnregisterObserver(IBroadcastObserver observer){
        getInstance().observers.remove(observer);
    }

    public static void NotifyObservers(String action, String value) {
        for (IBroadcastObserver observer : getInstance().observers) {
            try{
                observer.update(action, value);
            }
            catch(Exception e){
                Log.e("SonicLair Globals", e.getMessage());
            }
        }
    }

    public static MediaSessionCompat GetMediaSession(){
        return getInstance().mediaSession;
    }
}

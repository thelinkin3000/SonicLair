package tech.logica10.soniclair;

import android.media.browse.MediaBrowser;

import java.util.ArrayList;
import java.util.List;

public class Globals {
    // Static variable reference of single_instance
    // of type Singleton
    private static Globals single_instance = null;

    // Declaring a variable of type String
    private List<IBroadcastObserver> observers;
    private ArrayList<MediaBrowser.MediaItem> mediaItems;

    // Constructor
    // Here we will be creating private constructor
    // restricted to this class itself
    private Globals()
    {
        mediaItems = new ArrayList<MediaBrowser.MediaItem>();
        observers = new ArrayList<IBroadcastObserver>();
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

    public static void NotifyObservers(String action){
        for (IBroadcastObserver observer : getInstance().observers) {
            observer.update(action);
        }
    }

    public static ArrayList<MediaBrowser.MediaItem> GetMediaItems(){
        return getInstance().mediaItems;
    }

    public static void SetMediaItems(ArrayList<MediaBrowser.MediaItem> mediaItemArray) {
        getInstance().mediaItems = mediaItemArray;
    }
}

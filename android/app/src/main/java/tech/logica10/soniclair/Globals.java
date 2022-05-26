package tech.logica10.soniclair;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.List;

public class Globals {
    // Static variable reference of single_instance
    // of type Singleton
    private static Globals single_instance = null;

    // Declaring a variable of type String
    private List<BroadcastObserver> observers;

    // Constructor
    // Here we will be creating private constructor
    // restricted to this class itself
    private Globals()
    {
        observers = new ArrayList<BroadcastObserver>();
    }

    // Static method
    // Static method to create instance of Singleton class
    public static Globals getInstance()
    {
        if (single_instance == null)
            single_instance = new Globals();

        return single_instance;
    }

    public static void RegisterObserver(BroadcastObserver observer){
        getInstance().observers.add(observer);
    }

    public static void NotifyObservers(String action){
        for (BroadcastObserver observer : getInstance().observers) {
            observer.update(action);
        }
    }
}

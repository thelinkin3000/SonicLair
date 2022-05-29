package tech.logica10.soniclair;

import org.json.JSONException;

import java.util.concurrent.ExecutionException;

public interface IBroadcastObserver {
    public void update(String action, String value);
}

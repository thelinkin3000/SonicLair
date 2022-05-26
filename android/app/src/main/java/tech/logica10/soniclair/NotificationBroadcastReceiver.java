package tech.logica10.soniclair;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class NotificationBroadcastReceiver extends BroadcastReceiver {

    public NotificationBroadcastReceiver() {

    }

    private static final String TAG = "NotificationBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.i("RECEIVED!", "RECEIVED");
        Globals.NotifyObservers("PAUSE");
    }
}


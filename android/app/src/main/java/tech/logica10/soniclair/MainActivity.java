package tech.logica10.soniclair;

import android.content.Context;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static Context context;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        MainActivity.context = this;
        registerPlugin(VLCPlugin.class);
        registerPlugin(MediaSessionPlugin.class);
    }
}

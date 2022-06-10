package tech.logica10.soniclair;

import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.provider.MediaStore;
import android.provider.Settings;
import android.text.format.Formatter;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.getcapacitor.BridgeActivity;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketException;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {
    public static Context context;
    public static ActivityResultLauncher<String> requestPermissionLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        MainActivity.context = this;
        registerPlugin(BackendPlugin.class);
        registerPlugin(AndroidTVPlugin.class);
        requestPermissionLauncher =
                registerForActivityResult(new ActivityResultContracts.RequestPermission(),
                        isGranted -> {
                            // Do nothing I guess?
                        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        /* If FLAG_ACTIVITY_MULTIPLE_TASK has not been used, this activity
        is reused to create a new document.
         */
        if (intent.getAction().equals("android.media.action.MEDIA_PLAY_FROM_SEARCH")) {
            String mediaFocus =
                    intent.getStringExtra(MediaStore.EXTRA_MEDIA_FOCUS);
            String query = intent.getStringExtra(SearchManager.QUERY);

            // Some of these extras may not be available depending on the search mode
            String album = intent.getStringExtra(MediaStore.EXTRA_MEDIA_ALBUM);
            String artist = intent.getStringExtra(MediaStore.EXTRA_MEDIA_ARTIST);
            String title = intent.getStringExtra(MediaStore.EXTRA_MEDIA_TITLE);

            if (query == null) {
                Globals.NotifyObservers("SLPLAY", "");
            }
            // Determine the search mode and use the corresponding extras
            if (mediaFocus == null) {

                Globals.NotifyObservers("SLPLAYSEARCH", query);
            } else if (mediaFocus.compareTo("vnd.android.cursor.item/*") == 0) {
                if (!query.isEmpty()) {
                    // 'Unstructured' search mode
                    Globals.NotifyObservers("SLPLAYSEARCH", query.replace("on soniclair", ""));
                } else {
                    // 'Any' search mode
                    Globals.NotifyObservers("SLPLAY", "");
                }
            } else if (mediaFocus.compareTo(MediaStore.Audio.Artists.ENTRY_CONTENT_TYPE) == 0) {
                Globals.NotifyObservers("SLPLAYSEARCHARTIST", artist);
            } else if (mediaFocus.compareTo(MediaStore.Audio.Albums.ENTRY_CONTENT_TYPE) == 0) {
                Globals.NotifyObservers("SLPLAYSEARCHALBUM", album + " " + artist);
            } else if (mediaFocus.compareTo("vnd.android.cursor.item/audio") == 0) {
                Globals.NotifyObservers("SLPLAYSEARCH", title);
            }
        }
    }


}

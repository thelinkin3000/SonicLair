package tech.logica10.soniclair;

import static tech.logica10.soniclair.SubsonicModels.SearchResult;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.IBinder;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.json.JSONArray;
import org.json.JSONException;

import java.io.IOException;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import kotlinx.coroutines.CoroutineScope;
import kotlinx.coroutines.Dispatchers;
import okhttp3.Credentials;
import okhttp3.FormBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

@CapacitorPlugin(name = "VLC")
public class BackendPlugin extends Plugin implements IBroadcastObserver {

    private static SubsonicClient subsonicClient;
    private Gson gson;
    private String spotifyToken = "";
    private MusicService.LocalBinder binder = null;
    private Boolean mBound = false;
    /**
     * Defines callbacks for service binding, passed to bindService()
     */
    private final ServiceConnection connection = new ServiceConnection() {

        @Override
        public void onServiceConnected(ComponentName className,
                                       IBinder service) {
            // We've bound to LocalService, cast the IBinder and get LocalService instance
            binder = (MusicService.LocalBinder) service;
            mBound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName arg0) {
            mBound = false;
        }
    };

    @Override
    public void load() {
        // Set up
        if(subsonicClient == null){
            subsonicClient = new SubsonicClient(KeyValueStorage.Companion.getActiveAccount());
        }
        GsonBuilder builder = new GsonBuilder();
        builder.serializeNulls();
        gson = builder.create();
        // Bind to LocalService
        Intent intent = new Intent(App.getContext(), MusicService.class);
        App.getContext().bindService(intent, connection, Context.BIND_AUTO_CREATE);
        Globals.RegisterObserver(this);
    }

    private JSObject ErrorResponse(String error) {
        JSObject ret = new JSObject();
        ret.put("status", "error");
        ret.put("error", error);
        ret.put("value", null);
        return ret;
    }

    private JSObject OkResponse(Object value) throws JSONException {
        JSObject ret = new JSObject();
        ret.put("status", "ok");
        ret.put("error", null);
        String valueJson = gson.toJson(value);
        ret.put("value", new JSObject(valueJson));
        return ret;
    }

    private JSObject OkArrayResponse(Object value) throws JSONException {
        JSObject ret = new JSObject();
        ret.put("status", "ok");
        ret.put("error", null);
        String array = gson.toJson(value);
        JSONArray jsonarray = new JSONArray(array);
        ret.put("value", jsonarray);
        return ret;
    }

    private JSObject OkStringResponse(String value) {
        JSObject ret = new JSObject();
        ret.put("status", "ok");
        ret.put("error", null);
        ret.put("value", value);
        return ret;
    }

    @PluginMethod()
    public void login(PluginCall call) {
        JSObject data = call.getData();
        String username = data.getString("username");
        String password = data.getString("password");
        String url = data.getString("url");
        try {
            Account account = subsonicClient.login(username, password, url);
            KeyValueStorage.Companion.setActiveAccount(account);
            call.resolve(OkResponse(account));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getCameraPermissionStatus(PluginCall call) {
        if (ContextCompat.checkSelfPermission(MainActivity.context,
                "android.permission.CAMERA") == PackageManager.PERMISSION_GRANTED) {
            call.resolve(OkStringResponse(""));
        } else {
            call.resolve(ErrorResponse("Please provide permission to use the camera. This is needed for the QR scanner to work."));
        }
    }

    @PluginMethod()
    public void getCameraPermission(PluginCall call) {
        if (ContextCompat.checkSelfPermission(MainActivity.context,
                "android.permission.CAMERA") == PackageManager.PERMISSION_GRANTED) {
            call.resolve(OkStringResponse(""));
        } else {
            MainActivity.requestPermissionLauncher.launch("android.permission.CAMERA");
            call.resolve(OkStringResponse(""));
        }
    }


    @PluginMethod()
    public void getTopAlbums(PluginCall call) throws JSONException {
        try {
            String type = call.getString("type");
            if (type == null) {
                type = "frequent";
            }
            Integer size = call.getInt("size");
            if (size == null) {
                size = 10;
            }
            call.resolve(OkArrayResponse(subsonicClient.getTopAlbums(type, size)));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getAlbums(PluginCall call) throws JSONException {
        try {
            call.resolve(OkArrayResponse(subsonicClient.getAlbums()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getAlbum(PluginCall call) throws JSONException {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.resolve(ErrorResponse("Missing required parameter id"));
                return;
            }
            call.resolve(OkResponse(subsonicClient.getAlbum(id)));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getArtists(PluginCall call) throws JSONException {
        try {
            call.resolve(OkResponse(subsonicClient.getArtists()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getArtist(PluginCall call) throws JSONException {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.resolve(ErrorResponse("Missing required parameter id"));
                return;
            }
            call.resolve(OkResponse(subsonicClient.getArtist(id)));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getArtistInfo(PluginCall call) throws JSONException {
        try {
            String id = call.getString("id");
            if (id == null) {
                call.resolve(ErrorResponse("Missing required parameter id"));
                return;
            }
            call.resolve(OkResponse(subsonicClient.getArtistInfo(id)));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }


    @PluginMethod()
    public void getRandomSongs(PluginCall call) throws JSONException {
        try {
            call.resolve(OkArrayResponse(subsonicClient.getRandomSongs()));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getActiveAccount(PluginCall call) {
        try {
            JSObject ret = OkResponse(KeyValueStorage.Companion.getActiveAccount());
            call.resolve(ret);
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void setSettings(PluginCall call){
        try{
            Integer cacheSize = Integer.parseInt(call.getString("cacheSize"));
            KeyValueStorage.Companion.setSettings(new Settings(cacheSize));
            call.resolve(OkStringResponse(""));
        }
        catch(Exception e){
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getSettings(PluginCall call){
        try {
            JSObject ret = OkResponse(KeyValueStorage.Companion.getSettings());
            call.resolve(ret);
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getAccounts(PluginCall call) {
        try {
            JSObject ret = OkArrayResponse(KeyValueStorage.Companion.getAccounts());
            call.resolve(ret);
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void getAlbumArt(PluginCall call) {
        try {
            call.resolve(OkStringResponse(subsonicClient.getAlbumArt(call.getString("id"))));
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
    }

    @PluginMethod()
    public void play(PluginCall call) {
        Intent intent = new Intent(App.getContext(), MusicService.class);
        intent.setAction(Constants.Companion.getSERVICE_PLAY_PAUSE());
        App.getContext().startService(intent);
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void pause(PluginCall call) {
        Intent intent = new Intent(App.getContext(), MusicService.class);
        intent.setAction(Constants.Companion.getSERVICE_PLAY_PAUSE());
        App.getContext().startService(intent);
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void seek(PluginCall call) {
        JSObject ret = new JSObject();
        if (mBound) {
            float value = call.getFloat("time");
            binder.seek(value);
        }
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void setVolume(PluginCall call) {
        JSObject ret = new JSObject();
        if (mBound) {
            int value = call.getInt("volume", 100);
            binder.setVolume(value);
        }
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void playRadio(PluginCall call) throws ExecutionException, InterruptedException, JSONException {
        String id = call.getString("song");
        if (!mBound) {
            Intent intent = new Intent(App.getContext(), MusicService.class);
            intent.setAction(Constants.Companion.getSERVICE_PLAY_RADIO());
            intent.putExtra("id", id);
            App.getContext().startService(intent);

        } else {
            binder.playRadio(id);
        }

        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void playAlbum(PluginCall call) throws ExecutionException, InterruptedException, JSONException {
        String id = call.getString("album");
        Integer track = call.getInt("track");
        if (!mBound) {
            Intent intent = new Intent(App.getContext(), MusicService.class);
            intent.setAction(Constants.Companion.getSERVICE_PLAY_ALBUM());
            intent.putExtra("id", id);
            intent.putExtra("track", track);
            App.getContext().startService(intent);
        } else {
            binder.playAlbum(id, track);
        }
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void next(PluginCall call) throws JSONException, ExecutionException, InterruptedException {
        Intent intent = new Intent(App.getContext(), MusicService.class);
        intent.setAction(Constants.Companion.getSERVICE_NEXT());
        App.getContext().startService(intent);
        call.resolve(OkStringResponse(""));

    }

    @PluginMethod()
    public void getSpotifyToken(PluginCall call) throws IOException, JSONException {
        if (Objects.equals(spotifyToken, "")) {
            String client_id = "3cb3ecad8ce14e1dba560e3b5ceb908b";
            String client_secret = "86810d6f234142a9bf7be9d2a924bbba";
            Uri.Builder uriBuilder = new Uri.Builder()
                    .scheme("https")
                    .authority("accounts.spotify.com")
                    .appendPath("api")
                    .appendPath("token");
            RequestBody body = new FormBody.Builder()
                    .add("grant_type", "client_credentials")
                    .build();

            Request request = new Request.Builder()
                    .url(uriBuilder.build().toString())
                    .addHeader("Accept", "application/json")
                    .addHeader("Content-Type", "application/x-www-form-urlencoded")
                    .addHeader(
                            "Authorization",
                            Credentials.basic(client_id, client_secret))
                    .post(body)
                    .build();
            OkHttpClient client = new OkHttpClient.Builder()
                    .readTimeout(5000, TimeUnit.MILLISECONDS)
                    .writeTimeout(5000, TimeUnit.MILLISECONDS)
                    .build();


            Response response = client.newCall(request).execute();
            if (response.isSuccessful()) {
                spotifyToken = new JSObject(response.body().string()).getString("access_token");
            }

        }
        call.resolve(OkStringResponse(spotifyToken));
    }

    @PluginMethod()
    public void search(PluginCall call) {
        String query = call.getString("query");
        try {
            SearchResult result = subsonicClient.search(query);
            JSObject ret = OkResponse(result);
            call.resolve(ret);
            return;
        } catch (Exception e) {
            call.resolve(ErrorResponse(e.getMessage()));
        }
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void prev(PluginCall call) throws JSONException, ExecutionException, InterruptedException {
        Intent intent = new Intent(App.getContext(), MusicService.class);
        intent.setAction(Constants.Companion.getSERVICE_PREV());
        App.getContext().startService(intent);
        call.resolve(OkStringResponse(""));
    }

    @PluginMethod()
    public void getCurrentState(PluginCall call) throws JSONException {
        if (!mBound) {
            call.resolve(ErrorResponse("Music service is not yet bound"));
            return;
        }
        CurrentState state = binder.getCurrentState();
        call.resolve(OkResponse(state));
    }

    @Override
    public void update(String action, String value) {
        try {
            if (action.startsWith("SL")) {
                switch (action) {
                    case "SLPLAY":
                    case "SLPAUSE":
                        if (mBound) {
                            binder.playpause();
                        }
                        break;
                    case "SLPREV":
                        if (mBound) {
                            binder.prev();
                        }
                        break;
                    case "SLNEXT":
                        if (mBound) {
                            binder.next();
                        }
                        break;
                    case "SLPLAYID":
                        if (mBound) {
                            binder.playRadio(value);
                        } else {
                            Intent intent = new Intent(App.getContext(), MusicService.class);
                            intent.setAction(Constants.Companion.getSERVICE_PLAY_RADIO());
                            intent.putExtra("id", value);
                            App.getContext().startService(intent);
                        }
                        break;
                    case "SLPLAYSEARCH":
                        if(mBound){
                            binder.playSearch(value, SearchType.SONG);
                        }
                        else{
                            Intent intent = new Intent(App.getContext(), MusicService.class);
                            intent.setAction(Constants.Companion.getSERVICE_PLAY_SEARCH());
                            intent.putExtra("query", value);
                            App.getContext().startService(intent);
                        }
                    case "SLPLAYSEARCHARTIST":
                        if(mBound){
                            binder.playSearch(value, SearchType.ARTIST);
                        }
                        else{
                            Intent intent = new Intent(App.getContext(), MusicService.class);
                            intent.setAction(Constants.Companion.getSERVICE_PLAY_SEARCH_ARTIST());
                            intent.putExtra("query", value);
                            App.getContext().startService(intent);
                        }
                    case "SLPLAYSEARCHALBUM":
                        if(mBound){
                            binder.playSearch(value, SearchType.ALBUM);
                        }
                        else{
                            Intent intent = new Intent(App.getContext(), MusicService.class);
                            intent.setAction(Constants.Companion.getSERVICE_PLAY_SEARCH_ALBUM());
                            intent.putExtra("query", value);
                            App.getContext().startService(intent);
                        }
                }
            } else if (action.startsWith("MS")) {
                Log.i("SonicLair", "Notifying action" + action);
                if (value != null) {
                    notifyListeners(action.replace("MS", ""), new JSObject(value));
                } else {
                    notifyListeners(action.replace("MS", ""), null);
                }
            }
            else if(action.equals("EX")){
                notifyListeners("EX",new JSObject("{\"error\":\"" + value + "} \"}"));
            }
        } catch (Exception e) {
            Log.e("SonicLair",e.getMessage());
            // Frankly my dear, I couldn't care less.
        }
    }


}


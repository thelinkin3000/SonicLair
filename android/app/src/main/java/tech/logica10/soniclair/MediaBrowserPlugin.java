package tech.logica10.soniclair;

import android.graphics.Bitmap;
import android.media.MediaDescription;
import android.media.browse.MediaBrowser;
import android.net.Uri;

import com.bumptech.glide.Glide;
import com.bumptech.glide.request.FutureTarget;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

public class MediaBrowserPlugin extends Plugin {
    ArrayList<MediaBrowser.MediaItem> mediaItems;

    @Override
    public void load(){
        mediaItems = new ArrayList<>();
    }

    @PluginMethod
    public void loadItems(PluginCall call) throws JSONException, ExecutionException, InterruptedException {
        JSArray array = call.getArray("items");
        List<MediaItemJson> itemArray = array.toList();
        ArrayList<MediaBrowser.MediaItem> mediaItemArray = new ArrayList<MediaBrowser.MediaItem>();
        MediaDescription.Builder builder = new MediaDescription.Builder();
        for(MediaItemJson item: itemArray){
            builder.setTitle(item.song);
            builder.setSubtitle(String.format("by %s", item.artist));
            Uri albumArtUri = Uri.parse(item.albumArt);
            FutureTarget<Bitmap> futureBitmap = Glide.with(MainActivity.context)
                    .asBitmap()
                    .load(albumArtUri)
                    .submit();
            Bitmap albumArtBitmap = futureBitmap.get();
            builder.setIconBitmap(albumArtBitmap);
            builder.setMediaId(item.id);
            mediaItemArray.add(new MediaBrowser.MediaItem(builder.build(), MediaBrowser.MediaItem.FLAG_PLAYABLE));
        }
        Globals.SetMediaItems(mediaItemArray);
    }
}

class MediaItemJson{
    public String artist;
    public String album;
    public String albumArt;
    public String song;
    public float duration;
    public String id;
}
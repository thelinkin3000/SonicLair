package tech.logica10.soniclair;
import static android.content.Context.NOTIFICATION_SERVICE;
import static androidx.core.content.ContextCompat.getSystemService;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;

import android.net.Uri;
import android.provider.MediaStore;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;


import androidx.core.app.NotificationCompat;

import com.getcapacitor.AndroidProtocolHandler;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.cast.framework.media.NotificationAction;

import java.io.FileNotFoundException;
import java.io.IOException;

@CapacitorPlugin(name = "MediaSession")
public class MediaSessionPlugin extends Plugin implements BroadcastObserver {

    private MediaSession mediaSession;
    private Notification.Style mediaStyle;
    private NotificationManager notificationManager;
    private Notification.Builder notificationBuilder;
    private MediaMetadata.Builder metadataBuilder;
    private PlaybackState.Builder stateBuilder;
    private NotificationChannel channel;
    @Override
    public void load(){
        // Create a media session. NotificationCompat.MediaStyle
// PlayerService is your own Service or Activity responsible for media playback.
        mediaSession = new MediaSession(MainActivity.context, "PlayerService");


        notificationBuilder = new Notification.Builder(MainActivity.context, "soniclairr");
// Create a Notification which is styled by your MediaStyle object.
// This connects your media session to the media controls.
// Don't forget to include a small icon.
        mediaStyle = new Notification.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken());

// Specify any actions which your users can perform, such as pausing and skipping to the next track.

        metadataBuilder = new MediaMetadata.Builder();

        notificationManager = (NotificationManager)getSystemService(MainActivity.context,NotificationManager.class);
        stateBuilder = new PlaybackState.Builder();

        channel = new NotificationChannel(
                "soniclair",
                "Soniclair",
                NotificationManager.IMPORTANCE_HIGH);
        notificationManager.createNotificationChannel(channel);


        //This is the intent of PendingIntent
        Intent intentAction = new Intent(MainActivity.context,NotificationBroadcastReceiver.class);

        PendingIntent pIntentlogin = PendingIntent.getBroadcast(MainActivity.context,1,intentAction,PendingIntent.FLAG_UPDATE_CURRENT);

        // Specify any actions which your users can perform, such as pausing and skipping to the next track.
        Notification.Action.Builder builder = new Notification.Action.Builder(android.R.drawable.ic_media_play,"Play",pIntentlogin);
        Notification.Action pauseAction = builder.build();
        notificationBuilder.addAction(pauseAction);
        IntentFilter filter = new IntentFilter(Intent.ACTION_MEDIA_BUTTON);
        filter.addAction(Intent.ACTION_MEDIA_BUTTON);
        Globals.RegisterObserver(this);
    }

    @PluginMethod()
    public void play(PluginCall call){
        stateBuilder.setState(PlaybackState.STATE_PLAYING, 0,1);
        mediaSession.setPlaybackState(stateBuilder.build());
        mediaSession.setActive(true);
        call.resolve();
    }

    @PluginMethod()
    public void updateMedia(PluginCall call) {
        JSObject ret = new JSObject();
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM, call.getString("album"));
        Uri albumart = Uri.parse(call.getString("albumImage"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI, String.valueOf(albumart));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST, call.getString("artist"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_ARTIST, call.getString("artist"));
        metadataBuilder.putString(MediaMetadata.METADATA_KEY_TITLE, call.getString("song"));
        mediaSession.setMetadata(metadataBuilder.build());
        notificationBuilder.setSmallIcon(R.mipmap.ic_launcher);
        notificationBuilder.setContentTitle(call.getString("song"));
        notificationBuilder.setContentText(call.getString("album"));
        notificationBuilder.setStyle(mediaStyle);
        try{
            Bitmap bitmap = MediaStore.Images.Media.getBitmap(MainActivity.context.getContentResolver(), albumart);
            notificationBuilder.setLargeIcon(bitmap);
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        notificationBuilder.setChannelId("soniclair");
        notificationManager.notify("SonicLair", 1, notificationBuilder.build());
        ret.put("status", "ok");
        call.resolve(ret);
    }

    @Override
    public void update(String action) {
        if(action == "PAUSE"){
            notifyListeners("pause",null);
        }
    }


    private class MySessionCallback extends MediaSession.Callback {
        @Override
        public void onPlay(){

        }

    }




}

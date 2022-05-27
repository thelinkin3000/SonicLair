package tech.logica10.soniclair;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioDeviceCallback;
import android.media.AudioDeviceInfo;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.common.util.PlatformVersion;

import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;
import org.videolan.libvlc.interfaces.IMedia;
import org.videolan.libvlc.util.VLCVideoLayout;

import java.util.ArrayList;

@CapacitorPlugin(name = "VLC")
public class VLCPlugin extends Plugin {

    private static LibVLC mLibVLC = null;
    private static MediaPlayer mMediaPlayer = null;
    private VLCVideoLayout mVideoLayout = null;
    private String DefaultAudioDeviceId = "";
    private IMedia lastMedia = null;

    @Override
    public void load() {
        final ArrayList<String> args = new ArrayList<>();
        args.add("-vvv");


        // initialization of the audio attributes and focus request
        AudioManager mAudioManager = (AudioManager) MainActivity.context.getSystemService(Context.AUDIO_SERVICE);
        AudioAttributes mPlaybackAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
        AudioFocusRequest mFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(mPlaybackAttributes)
                .setAcceptsDelayedFocusGain(false)
                .setWillPauseWhenDucked(false)
                .setOnAudioFocusChangeListener(new AudioManager.OnAudioFocusChangeListener() {
                    @Override
                    public void onAudioFocusChange(int focusChange) {
                        switch (focusChange) {
                            case AudioManager.AUDIOFOCUS_GAIN:
                                if(mMediaPlayer.getMedia() != null){
                                    mMediaPlayer.play();
                                    notifyListeners("play", null);
                                }
                                break;
                            case AudioManager.AUDIOFOCUS_LOSS:
                            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
                                if(mMediaPlayer.isPlaying()){
                                    mMediaPlayer.pause();
                                    notifyListeners("paused", null);
                                }
                                break;
                        }
                    }
                })
                .build();
        final Object mFocusLock = new Object();
        boolean mPlaybackDelayed = false;

        // requesting audio focus
        int res = mAudioManager.requestAudioFocus(mFocusRequest);
        synchronized (mFocusLock) {
            if (res == AudioManager.AUDIOFOCUS_REQUEST_FAILED) {
                mPlaybackDelayed = false;
            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                mPlaybackDelayed = false;
            } else if (res == AudioManager.AUDIOFOCUS_REQUEST_DELAYED) {
                mPlaybackDelayed = true;
            }
        }

        if (mLibVLC == null) {
            mLibVLC = new LibVLC(MainActivity.context, args);
            mMediaPlayer = new MediaPlayer(mLibVLC);
            mMediaPlayer.setEventListener(new MediaPlayer.EventListener() {
                @Override
                public void onEvent(MediaPlayer.Event event) {
                    if (event.type == MediaPlayer.Event.TimeChanged) {
                        JSObject ret = new JSObject();
                        ret.put("time", mMediaPlayer.getPosition());
                        notifyListeners("progress", ret);
                    } else if (event.type == MediaPlayer.Event.Stopped) {
                        notifyListeners("stopped", null);
                    } else if (event.type == MediaPlayer.Event.Paused) {
                        notifyListeners("paused", null);
                    } else if (event.type == MediaPlayer.Event.Playing) {
                        notifyListeners("play", null);
                    }
                }
            });
        }

    }

    @PluginMethod()
    public void play(PluginCall call) {
        String value = call.getString("uri");
        if (value != null) {
            final Media media = new Media(mLibVLC, Uri.parse(value));
            mMediaPlayer.setMedia(media);
        }
        JSObject ret = new JSObject();
        ret.put("status", "ok");
        mMediaPlayer.play();

        call.resolve(ret);
    }

    @PluginMethod()
    public void pause(PluginCall call) {
        JSObject ret = new JSObject();
        if (mMediaPlayer.isPlaying()) {
            mMediaPlayer.pause();
        }
        ret.put("status", "ok");
        call.resolve(ret);
    }

    @PluginMethod()
    public void seek(PluginCall call) {
        JSObject ret = new JSObject();
        float value = call.getFloat("time");
        mMediaPlayer.setPosition(value);
        ret.put("status", "ok");
        call.resolve(ret);
    }

    @PluginMethod()
    public void setVolume(PluginCall call) {
        JSObject ret = new JSObject();
        int value = call.getInt("volume", 100);
        mMediaPlayer.setVolume(value);
        ret.put("status", "ok");
        call.resolve(ret);
    }
}
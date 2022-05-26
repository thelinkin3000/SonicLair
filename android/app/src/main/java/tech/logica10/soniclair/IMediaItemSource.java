package tech.logica10.soniclair;

import android.media.browse.MediaBrowser;

import java.util.ArrayList;

public interface IMediaItemSource {
    public ArrayList<MediaBrowser.MediaItem> getItems();
}

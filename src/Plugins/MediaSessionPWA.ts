import { WebPlugin } from "@capacitor/core";
import { MediaSessionPlugin } from "./MediaSession";

export class MediaSessionWeb extends WebPlugin implements MediaSessionPlugin {

    constructor() {
        super();
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("pause", () => {
                this.notifyListeners("pause", null);
            });
            navigator.mediaSession.setActionHandler("play", () => {
                this.notifyListeners("play", null);
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                this.notifyListeners("next", null);
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                this.notifyListeners("prev", null);
            });
        }
    }

    updateMedia({ album, albumImage, artist, song }
        : { album: string, albumImage: string, artist: string, song: string })
        : Promise<{ status: string; }> {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song,
                artist: artist,
                album: album,
                artwork: [{ src: albumImage }]
            });
        }
        return Promise.resolve({ status: "ok" });
    }

    play(): Promise<{ status: string; }> {
        if ("mediaSession" in navigator) {
            navigator.mediaSession.playbackState = "playing";
        }
        return Promise.resolve({ status: "ok" });
    }

}
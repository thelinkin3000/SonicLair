import { WebPlugin } from "@capacitor/core";
import { MediaSessionPlugin } from "./MediaSession";

export class MediaSessionWeb extends WebPlugin implements MediaSessionPlugin {

    constructor() {
        super();
        
    }

    updateMedia({ album, albumImage, artist, song }
        : { album: string, albumImage: string, artist: string, song: string })
        : Promise<{ status: string; }> {
        
        return Promise.resolve({ status: "ok" });
    }

    play(): Promise<{ status: string; }> {
        if ("mediaSession" in navigator) {
        }
        return Promise.resolve({ status: "ok" });
    }

}
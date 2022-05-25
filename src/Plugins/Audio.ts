import { WebPlugin } from '@capacitor/core';
import type VLC from "./VLC";

export interface IVLCWeb {
    audio: HTMLAudioElement;
}

// This name is EXTREMELY misleading as it implements audio playback using an HTML Audio Element
export class VLCWeb extends WebPlugin implements IVLCWeb {
    audio: HTMLAudioElement;


    constructor() {
        super();
        this.audio = new Audio();
    }

    

}
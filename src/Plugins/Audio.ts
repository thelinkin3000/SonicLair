import { ListenerCallback, PluginListenerHandle, WebPlugin } from '@capacitor/core';
import type VLC from "./VLC";
import { VlcPlugin } from './VLC';

export interface IVLCWeb {
    audio: HTMLAudioElement;
}


// This name is EXTREMELY misleading as it implements audio playback using an HTML Audio Element
export class VLCWeb extends WebPlugin implements IVLCWeb, VlcPlugin {

    isPlaying: boolean;
    audio: HTMLAudioElement;
    constructor() {
        super();
        this.audio = new Audio();
        this.isPlaying = false;
        this.audio.onplay = () => {
            if (this.listeners["play"]) {
                this.notifyListeners("play", null)
            }
        };
        this.audio.onpause = () => {
            if (this.listeners["paused"]) {
                this.notifyListeners("paused", null);
            }
        }
        this.audio.ontimeupdate = (ev: any) => {
            if (this.listeners["progress"]) {
                this.notifyListeners("progress", { time: ev.path[0].currentTime / ev.path[0].duration });
            }
        }
        this.audio.onended = () => {
            if (this.listeners["stopped"]) {
                this.notifyListeners("stopped", null);
            }
        }
    }

    async play(options: { uri: string | null; }): Promise<{ status: string; }> {
        console.log("play called");
        if (this.isPlaying) {
            await this.audio.pause();
        }
        if (options.uri) {
            this.audio.src = options.uri;
        }
        await this.audio.play();
        return Promise.resolve({ status: "ok" });
    }

    async pause(): Promise<{ status: string; }> {
        if (!this.isPlaying) {
            await this.audio.pause();
        }
        return Promise.resolve({ status: "ok" });
    }

    setVolume(options: { volume: number; }): Promise<{ status: string; }> {
        this.audio.volume = options.volume;
        return Promise.resolve({ status: "ok" });
    }

    seek(options: { time: number; }): Promise<{ status: string; }> {
        console.log(options.time);
        this.audio.currentTime = options.time * this.audio.duration;
        return Promise.resolve({ status: "ok" });
    }
}
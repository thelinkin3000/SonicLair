import { registerPlugin } from '@capacitor/core';

export interface VlcPlugin {
    play(options: { uri: string | null }): Promise<{ status: string }>;
    pause(): Promise<{ status: string }>;
    setVolume(options: { volume: number }): Promise<{ status: string }>;
    seek(options: { time: number }): Promise<{ status: string }>;
}
const VLC = registerPlugin<VlcPlugin>('VLC', {
    web: () => import('./Audio').then(m => new m.VLCWeb()),
});

export default VLC;
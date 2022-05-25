import { registerPlugin } from '@capacitor/core';

export interface VlcPlugin {
    play(options: { uri: string | null}): Promise<{ status: string }>;
    pause(): Promise<{ status: string }>;
    setVolume(options: { volume: number }): Promise<{ status: string }>;
    seek(options: { time: number }): Promise<{ status: string }>;
}
const VLC = registerPlugin<VlcPlugin>('VLC');

export default VLC;
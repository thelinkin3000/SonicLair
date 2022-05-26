import { registerPlugin } from '@capacitor/core';

export interface MediaSessionPlugin {
    updateMedia(options: { album: string, albumImage: string, artist: string, song: string }): Promise<{ status: string }>;
    play(): Promise<{ status: string }>;
}
const MediaSession = registerPlugin<MediaSessionPlugin>('MediaSession', {
    web: () => import('./MediaSessionPWA').then(m => new m.MediaSessionWeb()),
});

export default MediaSession;
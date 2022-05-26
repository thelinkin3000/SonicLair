import { registerPlugin } from '@capacitor/core';

export interface MediaBrowserPlugin {
    loadItems(items: {albumArt:string, album: string, artist: string, duration: number, song: string, id:string}[]): Promise<{ status: string }>
}
const MediaBrowser = registerPlugin<MediaBrowserPlugin>('MediaBrowser');

export default MediaBrowser;
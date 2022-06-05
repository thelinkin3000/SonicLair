import { registerPlugin, WebPlugin, Plugin } from '@capacitor/core';
import { IAlbumsResponse } from '../Models/API/Responses/IAlbumsResponse';
import { IArtistInfo, IArtistInfoResponse, ISearchResult } from '../Models/API/Responses/IArtistInfoResponse';
import { IAlbumArtistResponse, IAlbumResponse, IAlbumSongResponse, IArtistResponse, IInnerAlbumResponse, IInnerArtistResponse } from '../Models/API/Responses/IArtistResponse';
import { IArtistsResponse } from '../Models/API/Responses/IArtistsResponse';
import { IAccount, IAppContext } from '../Models/AppContext';

export interface IBackendResponse<T> {
    status: string;
    error: string;
    value: T | null;
}

export interface ICurrentState{
    playing: boolean;
    playtime: number;
    currentTrack: IAlbumSongResponse;
}

export interface IBackendPlugin extends Plugin{
    play(): Promise<IBackendResponse<string>>;
    pause(): Promise<IBackendResponse<string>>;
    setVolume(options: { volume: number }): Promise<IBackendResponse<string>>;
    seek(options: { time: number }): Promise<IBackendResponse<string>>;
    playAlbum(options: { album: string, track: number }): Promise<IBackendResponse<string>>;
    playRadio(options: { song: string }): Promise<IBackendResponse<string>>;
    getArtists(): Promise<IBackendResponse<IArtistsResponse>>;
    getArtist(options: { id: string }): Promise<IBackendResponse<IInnerArtistResponse>>;
    getAlbums(): Promise<IBackendResponse<IAlbumArtistResponse[]>>;
    getAlbum(options: { id: string }): Promise<IBackendResponse<IInnerAlbumResponse>>;
    getAlbumArt(options: { id: string }): Promise<IBackendResponse<string>>;
    getArtistInfo(options: { id: string }): Promise<IBackendResponse<IArtistInfo>>;
    search(options: { query: string }): Promise<IBackendResponse<ISearchResult>>;
    getTopAlbums(options: {type:string | null, size: number | null}): Promise<IBackendResponse<IAlbumArtistResponse[]>>;
    getRandomSongs(): Promise<IBackendResponse<IAlbumSongResponse[]>>;
    login(options: { username: string, password: string, url: string }): Promise<IBackendResponse<IAccount>>;
    getActiveAccount() : Promise<IBackendResponse<IAccount>>;
    getAccounts(): Promise<IBackendResponse<IAccount[]>>;
    deleteAccount(options:{url:string}): Promise<IBackendResponse<string>>;
    prev(): Promise<IBackendResponse<string>>;
    next(): Promise<IBackendResponse<string>>;
    getSpotifyToken(): Promise<string>;
    getSimilarSongs(options: { id: string }): Promise<IBackendResponse<IAlbumSongResponse[]>>;
    getCurrentState():Promise<IBackendResponse<ICurrentState>>;
    getCameraPermission():Promise<IBackendResponse<String>>;
    getCameraPermissionStatus():Promise<IBackendResponse<String>>;
}


const VLC = registerPlugin<IBackendPlugin>('VLC', {
    web: () => import('./Audio').then(m => new m.Backend()),
});

export default VLC;
import { registerPlugin, Plugin } from "@capacitor/core";
import { IArtist } from "../Models/API/Responses/IArtist";
import { ISearchResult } from "../Models/API/Responses/IArtistInfoResponse";
import {
    IAlbumArtistResponse,
    IAlbumSongResponse,
    IInnerAlbumResponse,
    IInnerArtistResponse,
} from "../Models/API/Responses/IArtistResponse";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";
import { IAccount } from "../Models/AppContext";

export interface IBackendResponse<T> {
    status: string;
    error: string;
    value: T | null;
}

export interface ICurrentState {
    playing: boolean;
    playtime: number;
    currentTrack: IAlbumSongResponse;
    shuffling: boolean;
}

export interface ISettings {
    cacheSize: number;
    transcoding: string;
}

export interface IBackendPlugin extends Plugin {
    getCurrentPlaylist(): Promise<IBackendResponse<IPlaylist>>;
    removeFromPlaylist(options: {
        id: string;
        track: number;
    }): Promise<IBackendResponse<string>>;
    addToPlaylist(options: {
        id: string | null;
        songId: string;
    }): Promise<IBackendResponse<string>>;
    createPlaylist(options: {
        songId: string[];
        name: string;
    }): Promise<IBackendResponse<IPlaylist>>;
    updatePlaylist(options: {
        playlist: IPlaylist;
    }): Promise<IBackendResponse<IPlaylist>>;
    removePlaylist(options: { id: string }): Promise<IBackendResponse<string>>;
    play(): Promise<IBackendResponse<string>>;
    pause(): Promise<IBackendResponse<string>>;
    setVolume(options: { volume: number }): Promise<IBackendResponse<string>>;
    seek(options: { time: number }): Promise<IBackendResponse<string>>;
    skipTo(options: { track: number }): Promise<IBackendResponse<string>>;
    playAlbum(options: {
        album: string;
        track: number;
    }): Promise<IBackendResponse<string>>;
    playRadio(options: { song: string }): Promise<IBackendResponse<string>>;
    playPlaylist(options: {
        playlist: string;
        track: number;
    }): Promise<IBackendResponse<string>>;
    getArtists(): Promise<IBackendResponse<IArtist[]>>;
    getArtist(options: {
        id: string;
    }): Promise<IBackendResponse<IInnerArtistResponse>>;
    getAlbums(): Promise<IBackendResponse<IAlbumArtistResponse[]>>;
    getAlbum(options: {
        id: string;
    }): Promise<IBackendResponse<IInnerAlbumResponse>>;
    getAlbumArt(options: { id: string }): Promise<IBackendResponse<string>>;
    getArtistArt(options: { id: string }): Promise<IBackendResponse<string>>;
    search(options: {
        query: string;
    }): Promise<IBackendResponse<ISearchResult>>;
    getTopAlbums(options: {
        type: string | null;
        size: number | null;
    }): Promise<IBackendResponse<IAlbumArtistResponse[]>>;
    getRandomSongs(): Promise<IBackendResponse<IAlbumSongResponse[]>>;
    getPlaylists(): Promise<IBackendResponse<IPlaylist[]>>;
    getPlaylist(options: { id: string }): Promise<IBackendResponse<IPlaylist>>;
    login(options: {
        username: string;
        password: string;
        url: string;
        usePlaintext: boolean;
    }): Promise<IBackendResponse<IAccount>>;
    getActiveAccount(): Promise<IBackendResponse<IAccount>>;
    getAccounts(): Promise<IBackendResponse<IAccount[]>>;
    deleteAccount(options: { url: string }): Promise<IBackendResponse<string>>;
    prev(): Promise<IBackendResponse<string>>;
    next(): Promise<IBackendResponse<string>>;
    getSpotifyToken(): Promise<string>;
    getSimilarSongs(options: {
        id: string;
    }): Promise<IBackendResponse<IAlbumSongResponse[]>>;
    getCurrentState(): Promise<IBackendResponse<ICurrentState>>;
    getCameraPermission(): Promise<IBackendResponse<String>>;
    getCameraPermissionStatus(): Promise<IBackendResponse<String>>;
    getSettings(): Promise<IBackendResponse<ISettings>>;
    setSettings(options: ISettings): Promise<IBackendResponse<String>>;
    getSongStatus(options: { id: string }): Promise<IBackendResponse<boolean>>;
    getOfflineMode(): Promise<IBackendResponse<boolean>>;
    setOfflineMode(options: {
        value: boolean;
    }): Promise<IBackendResponse<boolean>>;
    downloadAlbum(options: { id: string }): Promise<IBackendResponse<string>>;
    qrLogin(options: { ip: string }): Promise<IBackendResponse<string>>;
    disconnectWebsocket(): Promise<IBackendResponse<string>>;
    getWebsocketStatus(): Promise<IBackendResponse<boolean>>;
    sendUdpBroadcast(): Promise<IBackendResponse<String>>;
    shufflePlaylist(): Promise<IBackendResponse<string>>;
}

const VLC = registerPlugin<IBackendPlugin>("VLC", {
    web: () => import("./Audio").then((m) => new m.Backend()),
});

export default VLC;

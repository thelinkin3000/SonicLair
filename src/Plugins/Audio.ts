// This started as an audio backend, but is gonna mutate into a full audio-subsonic backend
// In time.

import { ListenerCallback, PluginListenerHandle, WebPlugin } from '@capacitor/core';
import axios from 'axios';
import md5 from 'js-md5';
import qs from 'qs';
import GetSimilarSongs from '../Api/GetSimilarSongs';
import { IBasicParams } from '../Models/API/Requests/BasicParams';
import { IAlbumsResponse } from '../Models/API/Responses/IAlbumsResponse';
import { IArtistInfo, IArtistInfoResponse, ISearchResponse, ISearchResult } from '../Models/API/Responses/IArtistInfoResponse';
import { IArtistResponse, IAlbumResponse, IAlbumSongResponse, IAlbumArtistResponse, IInnerArtistResponse, IInnerAlbumResponse } from '../Models/API/Responses/IArtistResponse';
import { IArtistsResponse } from '../Models/API/Responses/IArtistsResponse';
import { ISubsonicResponse } from '../Models/API/Responses/SubsonicResponse';
import { IAccount, IAppContext } from '../Models/AppContext';
import type VLC from "./VLC";
import { IBackendPlugin, IBackendResponse } from './VLC';



export interface IVLCWeb {
    audio: HTMLAudioElement;
}


// This name is EXTREMELY misleading as it implements audio playback using an HTML Audio Element
export class VLCWeb extends WebPlugin implements IVLCWeb, IBackendPlugin {
    playlist: IAlbumSongResponse[];
    isPlaying: boolean;
    audio: HTMLAudioElement;
    context: IAppContext;
    _spotifyToken: string;
    current: IAlbumSongResponse;

    constructor() {
        super();
        this.current = { album: "", albumId: "", artist: "", coverArt: "", duration: 0, id: "", parent: "", title: "", track: 0 };
        this._spotifyToken = "";
        this.context = { activeAccount: { username: null, password: "", url: "", type: "" }, accounts: [], spotifyToken: "" };
        this.playlist = [];
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

    getAlbumArt(options: { id: string; }): Promise<IBackendResponse<string>> {
        return Promise.resolve(
            this.OKResponse(`${this.context.activeAccount.url}/rest/getCoverArt?${this.getAsParams({ ...this.GetBasicParams(), id: options.id })}`
            ));
    }

    getSongArt(): Promise<IBackendResponse<string>> {
        throw new Error('Method not implemented.');
    }

    async loadContext() {
        const storagedCreds = localStorage.getItem('serverCreds');
        if (storagedCreds) {
            const cr: IAppContext = JSON.parse(storagedCreds);
            if (cr.activeAccount.username != null) {
                try {
                    const ret = await axios.get<{ "subsonic-response": ISubsonicResponse }>(`${cr.activeAccount.url}/rest/getArtists`, { params: this.GetBasicParams(cr.activeAccount) });
                    if (ret?.status !== 200 || ret?.data["subsonic-response"]?.status !== "ok") {
                        this.setContext({ context: { ...cr, activeAccount: { username: null, password: "", url: "", type: "" } } });
                    }
                    else {
                        this.setContext({ context: { ...cr } });
                    }

                }
                catch (e) {
                    this.setContext({ context: { ...cr, activeAccount: { username: null, password: "", url: "", type: "" } } });

                }
            }
        }
        else {
            this.setContext({ context: { activeAccount: { username: null, password: "", url: "", type: "" }, accounts: [], spotifyToken: await this.getSpotifyToken() } });

        }
    }

    async getSpotifyToken(): Promise<string> {
        if (this._spotifyToken !== "") {
            return this._spotifyToken;
        }
        var client_id = '3cb3ecad8ce14e1dba560e3b5ceb908b';
        var client_secret = '86810d6f234142a9bf7be9d2a924bbba';

        const headers = {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username: client_id,
                password: client_secret,
            },
        };
        const data = {
            grant_type: 'client_credentials',
        };

        try {
            const response = await axios.post(
                'https://accounts.spotify.com/api/token',
                qs.stringify(data),
                headers
            );
            // Cache it
            this._spotifyToken = response.data.access_token;
            return response.data.access_token;
        } catch (error) {
            throw error;
        }
    }

    async login(options: { username: string; password: string; url: string; }): Promise<IBackendResponse<IAccount>> {

        const uuid = "abcd1234";
        const hash = md5(`${options.password}${uuid}`);
        const basicParams: IBasicParams = {
            u: options.username,
            t: hash,
            s: uuid,
            v: "1.16.1",
            c: "soniclair",
            f: "json"
        };
        let newContext: IAppContext = { activeAccount: { username: null, password: "", url: "", type: "" }, accounts: [], spotifyToken: "" };

        try {
            const ret = await axios.get<{ "subsonic-response": ISubsonicResponse }>(`${options.url}/rest/getArtists`, { params: basicParams });
            if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
                const creds = {
                    username: options.username,
                    password: options.password,
                    url: this.removeTrailingSlash(options.url),
                    type: ret.data['subsonic-response'].type,
                };
                if (this.context!.accounts.filter(s => s.url === options.url).length === 1) {
                    const newContext: IAppContext = {
                        activeAccount: creds,
                        accounts: [
                            ...this.context.accounts.filter(s => s.url !== options.url),
                            creds],
                        spotifyToken: await this.getSpotifyToken(),
                    };
                    await this.setContext({ context: newContext });
                    localStorage.setItem('serverCreds', JSON.stringify(newContext));
                }
                else {
                    const newContext: IAppContext = {
                        activeAccount: creds,
                        accounts: [
                            ...this.context.accounts,
                            creds],
                        spotifyToken: await this.getSpotifyToken()
                    };
                    await this.setContext({ context: newContext });
                    localStorage.setItem('serverCreds', JSON.stringify(newContext));
                }
            }
            else if (ret?.data["subsonic-response"]?.status === "failed") {
                throw Error(ret?.data["subsonic-response"]?.error?.message!);
            }
        }
        catch (e) {
            throw Error("There was an error connecting to the server.")
        }
        return this.OKResponse<IAccount>(newContext.activeAccount);


    }
    getContext(): Promise<IBackendResponse<IAppContext>> {
        return Promise.resolve(this.OKResponse(this.context!));
    }

    setContext(options: { context: IAppContext }): Promise<IBackendResponse<string>> {
        this.context = options.context;
        localStorage.setItem("serverCreds", JSON.stringify(options.context));
        return Promise.resolve(this.OKResponse(""));
    }

    GetBasicParams(c?: IAccount): IBasicParams {
        // const uuid = uuidv4();
        const uuid = "abclknasd";
        if (c) {
            const hash = md5(`${c.password}${uuid}`);
            return {
                u: c.username!,
                t: hash,
                s: uuid,
                v: "1.16.1",
                c: "soniclair",
                f: "json"
            };
        }
        if (this.context === undefined) {
            throw new Error("Context not defined");
        }
        const hash = md5(`${this.context.activeAccount.password}${uuid}`);
        return {
            u: this.context.activeAccount.username!,
            t: hash,
            s: uuid,
            v: "1.16.1",
            c: "soniclair",
            f: "json"
        };

    }



    async playAlbum(options: { album: string; track: number; }): Promise<IBackendResponse<string>> {
        const album = await this.getAlbum({ id: options.album });
        if (album.status !== "ok") {
            return Promise.resolve(this.ErrorReponse(album.error));
        }
        this.playlist = album.value!.song;
        this.current = this.playlist[options.track];
        this._playCurrent();
        return Promise.resolve(this.OKResponse(""));
    }

    async playRadio(options: { song: string; }): Promise<IBackendResponse<string>> {
        const album = await GetSimilarSongs(this.context, options.song);
        this.playlist = album.similarSongs2.song;
        this.current = this.playlist[0];
        this._playCurrent();
        return Promise.resolve(this.OKResponse(""));
    }

    async getArtists(): Promise<IBackendResponse<IArtistsResponse>> {
        const ret = await axios.get<{ "subsonic-response": IArtistsResponse }>(`${this.context!.activeAccount.url}/rest/getArtists`, { params: this.GetBasicParams() });
        if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
            // return Promise.resolve(this.(ret.data["subsonic-response"] }));
            return Promise.resolve(this.OKResponse(ret.data["subsonic-response"]));
        }
        else {
            return this.ErrorReponse("Ocurrió un error");
        }
    }

    async search(options: { query: string }): Promise<IBackendResponse<ISearchResult>> {
        const params = { ...this.GetBasicParams(), query: options.query };
        const ret = await axios.get<{ "subsonic-response": ISearchResponse }>(`${this.context!.activeAccount.url}/rest/search3`, { params: params });
        if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
            return Promise.resolve(this.OKResponse(ret.data["subsonic-response"].searchResult3));
        }
        else {
            return this.ErrorReponse("Ocurrió un error");
        }
    }



    async getArtist(options: { id: string; }): Promise<IBackendResponse<IInnerArtistResponse>> {
        const params = { ...this.GetBasicParams(), id: options.id };
        const ret = await axios.get<{ "subsonic-response": IArtistResponse }>(`${this.context!.activeAccount.url}/rest/getArtist`, { params: params });
        if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
            return Promise.resolve(this.OKResponse(ret.data["subsonic-response"].artist));
        }
        else {
            return this.ErrorReponse("Ocurrió un error");
        }
    }

    async getAlbums(): Promise<IBackendResponse<IAlbumArtistResponse[]>> {
        let more: boolean = true;
        let albumsResponse: IAlbumsResponse | null = null;
        const params = this.GetBasicParams();
        let page = 0;
        while (more) {
            const ret = await axios.get<{ "subsonic-response": IAlbumsResponse; }>(`${this.context!.activeAccount.url}/rest/getAlbumList2`, { params: { ...params, type: "alphabeticalByName", size: 500, offset: page * 500 } });
            if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
                if (albumsResponse === null) {
                    albumsResponse = ret.data["subsonic-response"];
                }
                else {
                    albumsResponse.albumList2.album = [...albumsResponse.albumList2.album, ...ret.data["subsonic-response"].albumList2.album];
                }
                page++;
                if (ret.data["subsonic-response"].albumList2.album.length < 500) {
                    more = false;
                }
            }
            else {
                return this.ErrorReponse("Ocurrió un error");
            }
        }
        return Promise.resolve(this.OKResponse(albumsResponse!.albumList2.album));
    }

    async getAlbum(options: { id: string; }): Promise<IBackendResponse<IInnerAlbumResponse>> {
        const params = { ...this.GetBasicParams(), id: options.id };
        const ret = await axios.get<{ "subsonic-response": IAlbumResponse }>(`${this.context!.activeAccount.url}/rest/getAlbum`, { params: params });
        if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
            return Promise.resolve(this.OKResponse(ret.data["subsonic-response"].album));
        }
        else {
            return this.ErrorReponse("Ocurrió un error");
        }
    }

    async getArtistInfo(options: { id: string; }): Promise<IBackendResponse<IArtistInfo>> {
        const params = { ...this.GetBasicParams(), id: options.id };
        const ret = await axios.get<{ "subsonic-response": IArtistInfoResponse }>(`${this.context!.activeAccount.url}/rest/getArtistInfo2`, { params: params });
        if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
            return Promise.resolve(this.OKResponse(ret.data["subsonic-response"].artistInfo2));
        }
        else {
            return this.ErrorReponse("Ocurrió un error");
        }
    }

    async play(): Promise<IBackendResponse<string>> {
        if (this.current && !this.isPlaying) {
            await this.audio.play();
        }
        return this.OKResponse("");
    }

    async pause(): Promise<IBackendResponse<string>> {
        if (!this.isPlaying) {
            await this.audio.pause();
        }
        return this.OKResponse("");
    }

    getSongParams = (currentTrack: IAlbumSongResponse) => {
        return this.getAsParams({ ...this.GetBasicParams(), id: currentTrack.id });
    };

    async _playCurrent() {
        this.audio.src = `${this.context.activeAccount.url}/rest/stream?${this.getSongParams(this.current)}`;
        await this.audio.play();
    }

    _prev() {
        if (this.playlist.indexOf(this.current) !== 0) {
            this.current = this.playlist[this.playlist.indexOf(this.current) - 1];
        }
        this._playCurrent();
    }

    async prev(): Promise<IBackendResponse<string>> {
        this._prev();
        return this.OKResponse("");
    }

    _next() {
        if (this.playlist.indexOf(this.current) !== this.playlist.length - 1) {
            this.current = this.playlist[this.playlist.indexOf(this.current) + 1];
        }
        this._playCurrent();
    }

    async next(): Promise<IBackendResponse<string>> {
        this._next();
        return this.OKResponse("");
    }

    setVolume(options: { volume: number; }): Promise<IBackendResponse<string>> {
        this.audio.volume = options.volume;
        return Promise.resolve(this.OKResponse(""));

    }

    seek(options: { time: number; }): Promise<IBackendResponse<string>> {
        console.log(options.time);
        this.audio.currentTime = options.time * this.audio.duration;
        return Promise.resolve(this.OKResponse(""));
    }

    removeTrailingSlash(str: string) {
        return str.replace(/\/+$/, '');
    }

    getAsParams(data: any): string {
        return new URLSearchParams(data).toString();
    }

    OKResponse<T>(value: T) {
        return {
            status: "ok",
            error: "",
            value: value
        }
    }

    ErrorReponse<T>(error: string) {
        return {
            status: "error",
            error: error,
            value: null
        }
    }
}
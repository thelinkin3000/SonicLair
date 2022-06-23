// This started as an audio backend, but is gonna mutate into a full audio-subsonic backend
// In time.

import { WebPlugin } from "@capacitor/core";
import axios from "axios";
import md5 from "js-md5";
import qs from "qs";
import { IBasicParams } from "../Models/API/Requests/BasicParams";
import { IAlbumsResponse } from "../Models/API/Responses/IAlbumsResponse";
import { IArtist } from "../Models/API/Responses/IArtist";
import {
    IArtistInfo,
    IArtistInfoResponse,
    ISearchResponse,
    ISearchResult,
} from "../Models/API/Responses/IArtistInfoResponse";
import {
    IArtistResponse,
    IAlbumResponse,
    IAlbumSongResponse,
    IAlbumArtistResponse,
    IInnerArtistResponse,
    IInnerAlbumResponse,
    IRandomSongsResponse,
    ISimilarSongsResponse,
    ISongResponse,
} from "../Models/API/Responses/IArtistResponse";
import { IArtistsResponse } from "../Models/API/Responses/IArtistsResponse";
import {
    IPlaylist,
    IPlaylistResponse,
    IPlaylistsResponse,
} from "../Models/API/Responses/IPlaylistsResponse";
import {
    ISpotifyArtistItem,
    ISpotifyArtistsSearch,
} from "../Models/API/Responses/ISpotifyResponse";
import { ISubsonicResponse } from "../Models/API/Responses/SubsonicResponse";
import { IAccount, IAppContext } from "../Models/AppContext";
import {
    IBackendPlugin,
    IBackendResponse,
    ICurrentState,
    ISettings,
} from "./VLC";
import { GetAsParams, GetAsUrlParams, getPlaylistDuration } from "../Helpers";

function ValidateIPaddress(ipaddress: string): boolean {
    if (
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            ipaddress
        )
    ) {
        return true;
    }
    return false;
}

export class Backend extends WebPlugin implements IBackendPlugin {
    currentPlaylist: IPlaylist;
    isPlaying: boolean;
    audio: HTMLAudioElement;
    context: IAppContext;
    _spotifyToken: string;
    currentTrack: IAlbumSongResponse;

    constructor() {
        super();
        this.currentTrack = {
            album: "",
            albumId: "",
            artist: "",
            coverArt: "",
            duration: 0,
            id: "",
            parent: "",
            title: "",
            track: 0,
        };
        this._spotifyToken = "";
        let thisCreds = localStorage.getItem("serverCreds");
        if (thisCreds == null) {
            this.context = JSON.parse(
                '{ "activeAccount": { "username": null, "password": "", "url": "", "type": "" }, "accounts": [], "spotifyToken": "" }'
            );
        } else {
            this.context = JSON.parse(thisCreds);
        }
        this.currentPlaylist = {
            comment: "",
            coverArt: "",
            created: "",
            duration: 0,
            entry: [],
            id: "",
            name: "",
            owner: "",
            public: false,
            songCount: 0,
        };
        this.audio = new Audio();
        this.isPlaying = false;

        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("pause", () => {
                this.pause();
            });
            navigator.mediaSession.setActionHandler("play", () => {
                this.play();
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                this._next();
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                this.prev();
            });
        }

        this.audio.onplay = () => {
            this.isPlaying = true;
            if (this.listeners["play"]) {
                if ("mediaSession" in navigator) {
                    navigator.mediaSession.playbackState = "playing";
                }
                this.notifyListeners("play", null);
            }
        };
        this.audio.onpause = () => {
            this.isPlaying = false;
            if (this.listeners["paused"]) {
                if ("mediaSession" in navigator) {
                    navigator.mediaSession.playbackState = "paused";
                }
                this.notifyListeners("paused", null);
            }
        };
        this.audio.ontimeupdate = (ev: any) => {
            if ("mediaSession" in navigator) {
                navigator.mediaSession.setPositionState({
                    duration: this.currentTrack.duration,
                    playbackRate: 1,
                    position: ev.path[0].currentTime,
                });
            }
            if (this.listeners["progress"]) {
                this.notifyListeners("progress", {
                    time: ev.path[0].currentTime / this.currentTrack.duration,
                });
            }
        };
        this.audio.onended = () => {
            this.isPlaying = false;
            if (this.listeners["stopped"]) {
                if ("mediaSession" in navigator) {
                    navigator.mediaSession.playbackState = "none";
                }
                this.notifyListeners("stopped", null);
            }
            this._next();
        };
    }
    async removeFromPlaylist(options: {
        id: string;
        track: number;
    }): Promise<IBackendResponse<string>> {
        const ret = await axios.get<{
            "subsonic-response": IPlaylistResponse;
        }>(`${this.context.activeAccount.url}/rest/updatePlaylist`, {
            params: {
                ...this.GetBasicParams(),
                songIndexToRemove: options.track,
                playlistId: options.id,
            },
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse("");
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async createPlaylist(options: {
        songId: string[];
        name: string;
    }): Promise<IBackendResponse<IPlaylist>> {
        const params = GetAsUrlParams(this.GetBasicParams());
        params.append("name", options.name);
        options.songId.forEach((s) => params.append("songId", s));
        const ret = await axios.get<{
            "subsonic-response": IPlaylistResponse;
        }>(`${this.context.activeAccount.url}/rest/createPlaylist`, {
            params: params,
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse(ret?.data["subsonic-response"].playlist);
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async removePlaylist(options: {
        id: string;
    }): Promise<IBackendResponse<string>> {
        const params = GetAsUrlParams(this.GetBasicParams());
        params.append("id", options.id);
        const ret = await axios.get<{
            "subsonic-response": IPlaylistResponse;
        }>(`${this.context.activeAccount.url}/rest/deletePlaylist`, {
            params: params,
        });
        if (ret?.status !== 200) {
            return this.ErrorResponse(ret?.statusText);
        } else {
            return this.OKResponse("");
        }
    }

    async updatePlaylist(options: {
        playlist: IPlaylist;
    }): Promise<IBackendResponse<IPlaylist>> {
        // First we update the playlist settings
        const params = GetAsUrlParams(this.GetBasicParams());
        params.append("name", options.playlist.name);
        params.append("comment", options.playlist.comment ?? "");
        params.append("public", options.playlist.public ? "true" : "false");
        params.append("playlistId", options.playlist.id);

        const ret = await axios.get<{
            "subsonic-response": IPlaylistResponse;
        }>(`${this.context.activeAccount.url}/rest/updatePlaylist`, {
            params: params,
        });
        if (ret?.status !== 200) {
            return this.ErrorResponse(ret?.statusText);
        }
        const createParams = GetAsUrlParams(this.GetBasicParams());

        // Now we update the song order
        createParams.append("playlistId", options.playlist.id);
        options.playlist.entry.forEach((s) =>
            createParams.append("songId", s.id)
        );
        const createRet = await axios.get<{
            "subsonic-response": IPlaylistResponse;
        }>(`${this.context.activeAccount.url}/rest/createPlaylist`, {
            params: createParams,
        });
        if (createRet?.status !== 200) {
            return this.ErrorResponse(ret?.statusText);
        } else {
            return this.OKResponse(ret?.data["subsonic-response"].playlist);
        }
    }

    async addToPlaylist(options: {
        id: string | null;
        songId: string;
    }): Promise<IBackendResponse<string>> {
        debugger;
        if (options.id === null) {
            const r = await this.createPlaylist({
                songId: [options.songId],
                name: "New playlist",
            });
            if(r.status === "ok"){
                return this.OKResponse("");
            }
            else{
                return this.ErrorResponse(r.error);
            }
        }
        const ret = await axios.get<{
            "subsonic-response": IPlaylistResponse;
        }>(`${this.context.activeAccount.url}/rest/updatePlaylist`, {
            params: {
                ...this.GetBasicParams(),
                songIdToAdd: options.songId,
                playlistId: options.id,
            },
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse("");
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    sendUdpBroadcast(): Promise<IBackendResponse<String>> {
        throw new Error("Method not implemented.");
    }

    async getWebsocketStatus(): Promise<IBackendResponse<boolean>> {
        return this.OKResponse(false);
    }

    async disconnectWebsocket(): Promise<IBackendResponse<string>> {
        return this.OKResponse("");
    }

    async qrLogin(options: { ip: string }): Promise<IBackendResponse<string>> {
        if (ValidateIPaddress(options.ip)) {
            try {
                let socket = new WebSocket(`ws://${options.ip}:30001`);
                socket.onopen = () => {
                    let outgoingMessage = JSON.stringify({
                        type: "login",
                        data: this.context.activeAccount,
                    });
                    socket.send(outgoingMessage);
                };
                socket.onerror = () => {
                    this.notifyListeners(
                        "EX",
                        "There was an error connecting to the TV. Please, try again"
                    );
                };
                socket.onmessage = (message) => {
                    console.log(message);
                    if (message.data === "soniclair") {
                        socket.close();
                    }
                };
                return this.OKResponse("Login request sent");
            } catch (e: any) {
                return this.ErrorResponse(e.message);
            }
        } else {
            return this.ErrorResponse(
                "The QR code is not an IP address. Please try again."
            );
        }
    }
    async downloadAlbum(options: {
        id: string;
    }): Promise<IBackendResponse<string>> {
        return this.ErrorResponse("Not supported on PWA");
    }
    async getOfflineMode(): Promise<IBackendResponse<boolean>> {
        return this.OKResponse<boolean>(false);
    }
    async setOfflineMode(options: {
        value: boolean;
    }): Promise<IBackendResponse<boolean>> {
        return this.OKResponse<boolean>(false);
    }
    async getSongStatus(options: {
        id: string;
    }): Promise<IBackendResponse<boolean>> {
        return this.OKResponse<boolean>(false);
    }
    async getSettings(): Promise<IBackendResponse<ISettings>> {
        if (localStorage.getItem("settings") === null) {
            return this.OKResponse({ cacheSize: 0, transcoding: "" });
        } else {
            return this.OKResponse(
                JSON.parse(localStorage.getItem("settings")!)
            );
        }
    }
    async setSettings(options: ISettings): Promise<IBackendResponse<String>> {
        console.log("setSettings", options);
        localStorage.setItem("settings", JSON.stringify(options));
        return this.OKResponse("");
    }
    getCameraPermission(): Promise<IBackendResponse<String>> {
        throw new Error("Method not implemented.");
    }
    getCameraPermissionStatus(): Promise<IBackendResponse<String>> {
        throw new Error("Method not implemented.");
    }
    getCurrentState(): Promise<IBackendResponse<ICurrentState>> {
        return Promise.resolve(
            this.OKResponse({
                playing: this.isPlaying,
                currentTrack: this.currentTrack,
                playtime: this.audio.currentTime / this.audio.duration,
            })
        );
    }

    async getCurrentPlaylist(): Promise<IBackendResponse<IPlaylist>> {
        return this.OKResponse(this.currentPlaylist);
    }
    getActiveAccount(): Promise<IBackendResponse<IAccount>> {
        return Promise.resolve(this.OKResponse(this.context.activeAccount));
    }

    deleteAccount(options: { url: string }): Promise<IBackendResponse<string>> {
        this.context = {
            activeAccount: this.context.activeAccount,
            spotifyToken: this.context.spotifyToken,
            accounts: this.context.accounts.filter(
                (s) => s.url !== options.url
            ),
        };
        localStorage.setItem("serverCreds", JSON.stringify(this.context));
        return Promise.resolve(this.OKResponse(""));
    }

    getAccounts(): Promise<IBackendResponse<IAccount[]>> {
        return Promise.resolve(this.OKResponse(this.context.accounts));
    }

    async getTopAlbums({
        type,
        size,
    }: {
        type: string | null;
        size: number | null;
    }): Promise<IBackendResponse<IAlbumArtistResponse[]>> {
        const params = this.GetBasicParams();
        const ret = await axios.get<{ "subsonic-response": IAlbumsResponse }>(
            `${this.context.activeAccount.url}/rest/getAlbumList2`,
            {
                params: {
                    ...params,
                    type: type ?? "frequent",
                    size: size ?? 10,
                },
            }
        );
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse(
                    ret.data["subsonic-response"]!.albumList2.album
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }
    async getRandomSongs(): Promise<IBackendResponse<IAlbumSongResponse[]>> {
        const ret = await axios.get<{
            "subsonic-response": IRandomSongsResponse;
        }>(`${this.context.activeAccount.url}/rest/getRandomSongs`, {
            params: { ...this.GetBasicParams(), size: 10 },
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse(
                    ret.data["subsonic-response"].randomSongs.song
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async getPlaylists(): Promise<IBackendResponse<IPlaylist[]>> {
        const ret = await axios.get<{
            "subsonic-response": IPlaylistsResponse;
        }>(`${this.context.activeAccount.url}/rest/getPlaylists`, {
            params: this.GetBasicParams(),
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse(
                    ret.data["subsonic-response"].playlists.playlist
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }
    async getPlaylist(options: {
        id: string;
    }): Promise<IBackendResponse<IPlaylist>> {
        const ret = await axios.get<{
            "subsonic-response": IPlaylistResponse;
        }>(`${this.context.activeAccount.url}/rest/getPlaylist`, {
            params: { ...this.GetBasicParams(), id: options.id },
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse(ret.data["subsonic-response"].playlist);
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    getAlbumArt(options: { id: string }): Promise<IBackendResponse<string>> {
        return Promise.resolve(
            this.OKResponse(
                `${
                    this.context.activeAccount.url
                }/rest/getCoverArt?${GetAsParams({
                    ...this.GetBasicParams(),
                    id: options.id,
                })}`
            )
        );
    }

    getSongArt(): Promise<IBackendResponse<string>> {
        throw new Error("Method not implemented.");
    }

    async loadContext() {
        const storagedCreds = localStorage.getItem("serverCreds");
        if (storagedCreds) {
            const cr: IAppContext = JSON.parse(storagedCreds);
            if (cr.activeAccount.username != null) {
                try {
                    const ret = await axios.get<{
                        "subsonic-response": ISubsonicResponse;
                    }>(`${cr.activeAccount.url}/rest/getArtists`, {
                        params: this.GetBasicParams(cr.activeAccount),
                    });
                    if (
                        ret?.status !== 200 ||
                        ret?.data["subsonic-response"]?.status !== "ok"
                    ) {
                        this.setContext({
                            context: {
                                ...cr,
                                activeAccount: {
                                    username: null,
                                    password: "",
                                    url: "",
                                    type: "",
                                    usePlaintext: false,
                                },
                            },
                        });
                    } else {
                        this.setContext({ context: { ...cr } });
                    }
                } catch (e) {
                    this.setContext({
                        context: {
                            ...cr,
                            activeAccount: {
                                username: null,
                                password: "",
                                url: "",
                                type: "",
                                usePlaintext: false,
                            },
                        },
                    });
                }
            }
        } else {
            this.setContext({
                context: {
                    activeAccount: {
                        username: null,
                        password: "",
                        url: "",
                        type: "",
                        usePlaintext: false,
                    },
                    accounts: [],
                    spotifyToken: await this.getSpotifyToken(),
                },
            });
        }
    }

    async getSpotifyToken(): Promise<string> {
        if (this._spotifyToken !== "") {
            return this._spotifyToken;
        }
        var client_id = "3cb3ecad8ce14e1dba560e3b5ceb908b";
        var client_secret = "86810d6f234142a9bf7be9d2a924bbba";

        const headers = {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            auth: {
                username: client_id,
                password: client_secret,
            },
        };
        const data = {
            grant_type: "client_credentials",
        };

        try {
            const response = await axios.post(
                "https://accounts.spotify.com/api/token",
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

    async login(options: {
        username: string;
        password: string;
        url: string;
        usePlaintext: boolean;
    }): Promise<IBackendResponse<IAccount>> {
        const uuid = "abcd1234";
        const hash = md5(`${options.password}${uuid}`);
        const basicParams: IBasicParams = {
            u: options.username,
            t: options.usePlaintext ? undefined : hash,
            s: options.usePlaintext ? undefined : uuid,
            v: "1.16.1",
            c: "soniclair",
            f: "json",
            p: options.usePlaintext ? options.password : undefined,
        };

        let newContext: IAppContext = {
            activeAccount: {
                username: null,
                password: "",
                url: "",
                type: "",
                usePlaintext: false,
            },
            accounts: [],
            spotifyToken: "",
        };

        try {
            const ret = await axios.get<{
                "subsonic-response": ISubsonicResponse;
            }>(`${options.url}/rest/getArtists`, { params: basicParams });
            if (
                ret?.status === 200 &&
                ret?.data["subsonic-response"]?.status === "ok"
            ) {
                const creds: IAccount = {
                    username: options.username,
                    password: options.password,
                    url: this.removeTrailingSlash(options.url),
                    type: ret.data["subsonic-response"].type,
                    usePlaintext: options.usePlaintext,
                };
                if (
                    this.context!.accounts.filter((s) => s.url === options.url)
                        .length === 1
                ) {
                    newContext = {
                        activeAccount: creds,
                        accounts: [
                            ...this.context.accounts.filter(
                                (s) => s.url !== options.url
                            ),
                            creds,
                        ],
                        spotifyToken: await this.getSpotifyToken(),
                    };
                    await this.setContext({ context: newContext });
                    localStorage.setItem(
                        "serverCreds",
                        JSON.stringify(newContext)
                    );
                } else {
                    newContext = {
                        activeAccount: creds,
                        accounts: [...this.context.accounts, creds],
                        spotifyToken: await this.getSpotifyToken(),
                    };
                    await this.setContext({ context: newContext });
                    localStorage.setItem(
                        "serverCreds",
                        JSON.stringify(newContext)
                    );
                }
            } else if (ret?.data["subsonic-response"]?.status === "failed") {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } catch (e) {
            return this.ErrorResponse(
                "There was an error connecting to the server."
            );
        }
        return this.OKResponse<IAccount>(newContext.activeAccount);
    }
    getContext(): Promise<IBackendResponse<IAppContext>> {
        return Promise.resolve(this.OKResponse(this.context!));
    }

    setContext(options: {
        context: IAppContext;
    }): Promise<IBackendResponse<string>> {
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
                t: c.usePlaintext ? undefined : hash,
                s: c.usePlaintext ? undefined : uuid,
                v: "1.16.1",
                c: "soniclair",
                f: "json",
                p: c.usePlaintext ? c.password : undefined,
            };
        }
        if (this.context === undefined) {
            throw new Error("Context not defined");
        }
        const hash = md5(`${this.context.activeAccount.password}${uuid}`);
        return {
            u: this.context.activeAccount.username!,
            t: this.context.activeAccount.usePlaintext ? undefined : hash,
            s: this.context.activeAccount.usePlaintext ? undefined : uuid,
            v: "1.16.1",
            c: "soniclair",
            f: "json",
            p: this.context.activeAccount.usePlaintext
                ? this.context.activeAccount.password
                : undefined,
        };
    }

    async getSong(options: {
        id: string;
    }): Promise<IBackendResponse<IAlbumSongResponse>> {
        const ret = await axios.get<{
            "subsonic-response": ISongResponse;
        }>(`${this.context.activeAccount.url}/rest/getSong`, {
            params: { ...this.GetBasicParams(), size: 10, id: options.id },
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse(ret.data["subsonic-response"].song);
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async getSimilarSongs(options: {
        id: string;
    }): Promise<IBackendResponse<IAlbumSongResponse[]>> {
        const ret = await axios.get<{
            "subsonic-response": ISimilarSongsResponse;
        }>(`${this.context.activeAccount.url}/rest/getSimilarSongs2`, {
            params: { ...this.GetBasicParams(), size: 10, id: options.id },
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return this.OKResponse(
                    ret.data["subsonic-response"].similarSongs2.song
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    scrobble() {
        const params = { ...this.GetBasicParams(), id: this.currentTrack.id };
        axios.get(`${this.context!.activeAccount.url}/rest/scrobble`, {
            params: params,
        });
    }

    async playAlbum(options: {
        album: string;
        track: number;
    }): Promise<IBackendResponse<string>> {
        const album = await this.getAlbum({ id: options.album });
        if (album.status !== "ok") {
            return this.ErrorResponse(album.error);
        }
        this.currentPlaylist = {
            comment: `by ${album.value?.artist}`,
            coverArt: album.value!.coverArt,
            created: "",
            duration: getPlaylistDuration(album.value!.song),
            entry: album.value!.song,
            id: "current",
            name: album.value!.name!,
            owner: (await this.getActiveAccount()).value!.username!,
            public: false,
            songCount: album.value!.song.length,
        };

        this.currentTrack = this.currentPlaylist.entry[options.track];
        this._playCurrent();
        return Promise.resolve(this.OKResponse(""));
    }
    async playPlaylist(options: {
        playlist: string;
        track: number;
    }): Promise<IBackendResponse<string>> {
        const playlist = await this.getPlaylist({ id: options.playlist });
        if (playlist.status !== "ok") {
            return this.ErrorResponse(playlist.error);
        }
        this.currentPlaylist = playlist.value!;
        this.currentTrack = this.currentPlaylist.entry[options.track];
        this._playCurrent();
        return Promise.resolve(this.OKResponse(""));
    }

    async skipTo(options: {
        track: number;
    }): Promise<IBackendResponse<string>> {
        if (options.track >= this.currentPlaylist.entry.length) {
            return this.ErrorResponse(
                "The track does not exist on the playlist"
            );
        }
        this.currentTrack = this.currentPlaylist.entry[options.track];
        this._playCurrent();
        return Promise.resolve(this.OKResponse(""));
    }

    async playRadio(options: {
        song: string;
    }): Promise<IBackendResponse<string>> {
        const songList = await this.getSimilarSongs({ id: options.song });
        if (songList.status !== "ok") {
            return this.ErrorResponse(songList.error);
        }
        const song = await this.getSong({ id: options.song });
        if (song.status !== "ok") {
            return this.ErrorResponse(song.error);
        }
        this.currentPlaylist = {
            comment: `by ${song.value?.artist}`,
            coverArt: song.value!.albumId,
            created: "",
            duration: getPlaylistDuration([song.value!, ...songList.value!]),
            entry: [song.value!, ...songList.value!],
            id: "current",
            name: `Radio based on ${song.value!.title}`,
            owner: (await this.getActiveAccount()).value!.username!,
            public: false,
            songCount: [song.value!, ...songList.value!].length,
        };
        this.currentTrack = this.currentPlaylist.entry[0];
        this._playCurrent();
        return this.OKResponse("");
    }

    async getArtists(): Promise<IBackendResponse<IArtist[]>> {
        const ret = await axios.get<{ "subsonic-response": IArtistsResponse }>(
            `${this.context!.activeAccount.url}/rest/getArtists`,
            { params: this.GetBasicParams() }
        );
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                const r = ret.data["subsonic-response"].artists!.index!.reduce<
                    IArtist[]
                >((previous, s) => {
                    return [...previous, ...s.artist];
                }, []);
                return this.OKResponse(r);
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async search(options: {
        query: string;
    }): Promise<IBackendResponse<ISearchResult>> {
        const params = { ...this.GetBasicParams(), query: options.query };
        const ret = await axios.get<{ "subsonic-response": ISearchResponse }>(
            `${this.context!.activeAccount.url}/rest/search3`,
            { params: params }
        );
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return Promise.resolve(
                    this.OKResponse(ret.data["subsonic-response"].searchResult3)
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async getArtist(options: {
        id: string;
    }): Promise<IBackendResponse<IInnerArtistResponse>> {
        const params = { ...this.GetBasicParams(), id: options.id };
        const ret = await axios.get<{ "subsonic-response": IArtistResponse }>(
            `${this.context!.activeAccount.url}/rest/getArtist`,
            { params: params }
        );
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return Promise.resolve(
                    this.OKResponse(ret.data["subsonic-response"].artist)
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async getAlbums(): Promise<IBackendResponse<IAlbumArtistResponse[]>> {
        let more: boolean = true;
        let albumsResponse: IAlbumsResponse | null = null;
        const params = this.GetBasicParams();
        let page = 0;
        while (more) {
            const ret = await axios.get<{
                "subsonic-response": IAlbumsResponse;
            }>(`${this.context!.activeAccount.url}/rest/getAlbumList2`, {
                params: {
                    ...params,
                    type: "alphabeticalByName",
                    size: 500,
                    offset: page * 500,
                },
            });
            if (ret?.status === 200) {
                if (ret?.data["subsonic-response"]?.status === "ok") {
                    if (albumsResponse === null) {
                        albumsResponse = ret.data["subsonic-response"];
                    } else {
                        albumsResponse.albumList2.album = [
                            ...albumsResponse.albumList2.album,
                            ...ret.data["subsonic-response"].albumList2.album,
                        ];
                    }
                    page++;
                    if (
                        ret.data["subsonic-response"].albumList2.album.length <
                        500
                    ) {
                        more = false;
                    }
                } else {
                    return this.ErrorResponse(
                        ret?.data["subsonic-response"]?.error?.message!
                    );
                }
            } else {
                return this.ErrorResponse(ret?.statusText);
            }
        }
        return this.OKResponse(albumsResponse!.albumList2.album);
    }

    async getAlbum(options: {
        id: string;
    }): Promise<IBackendResponse<IInnerAlbumResponse>> {
        const params = { ...this.GetBasicParams(), id: options.id };
        const ret = await axios.get<{ "subsonic-response": IAlbumResponse }>(
            `${this.context!.activeAccount.url}/rest/getAlbum`,
            { params: params }
        );
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return Promise.resolve(
                    this.OKResponse(ret.data["subsonic-response"].album)
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async getArtistInfo(options: {
        id: string;
    }): Promise<IBackendResponse<IArtistInfo>> {
        const params = { ...this.GetBasicParams(), id: options.id };
        const ret = await axios.get<{
            "subsonic-response": IArtistInfoResponse;
        }>(`${this.context!.activeAccount.url}/rest/getArtistInfo2`, {
            params: params,
        });
        if (ret?.status === 200) {
            if (ret?.data["subsonic-response"]?.status === "ok") {
                return Promise.resolve(
                    this.OKResponse(ret.data["subsonic-response"].artistInfo2)
                );
            } else {
                return this.ErrorResponse(
                    ret?.data["subsonic-response"]?.error?.message!
                );
            }
        } else {
            return this.ErrorResponse(ret?.statusText);
        }
    }

    async GetSpotifyArtist(
        token: string,
        query: string
    ): Promise<ISpotifyArtistItem[]> {
        const params = {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            params: {
                q: query,
                type: "artist",
            },
        };

        try {
            const response = await axios.get<ISpotifyArtistsSearch>(
                "https://api.spotify.com/v1/search",
                params
            );
            return response.data.artists.items;
        } catch (error) {
            return [];
        }
    }

    async getArtistArt(options: {
        id: string;
    }): Promise<IBackendResponse<string>> {
        const artist = await this.getArtist({ id: options.id });
        if (artist.status !== "ok") {
            return this.OKResponse("");
        }
        const items = await this.GetSpotifyArtist(
            await this.getSpotifyToken(),
            artist!.value!.name
        );
        if (items.length > 0 && items[0].name === artist!.value!.name) {
            if (items[0].images.length > 1) {
                return this.OKResponse(items[0].images[1].url);
            } else {
                return this.OKResponse(items[0].images[0].url);
            }
        } else {
            const ret = await this.getArtistInfo({ id: options.id });
            if (ret.status === "ok") {
                return this.OKResponse(ret.value!.largeImageUrl);
            } else {
                return this.ErrorResponse(ret.error);
            }
        }
    }

    async play(): Promise<IBackendResponse<string>> {
        if (this.currentTrack && !this.isPlaying) {
            await this.audio.play();
        }
        return this.OKResponse("");
    }

    async pause(): Promise<IBackendResponse<string>> {
        if (this.isPlaying) {
            await this.audio.pause();
        }
        return this.OKResponse("");
    }

    getSongParams = (currentTrack: IAlbumSongResponse) => {
        const s = localStorage.getItem("settings");
        let transcoding = "raw";
        let settings: ISettings;
        if (s != null) {
            settings = JSON.parse(s);
        } else {
            settings = { cacheSize: 0, transcoding: "" };
        }
        if (settings.transcoding !== "") {
            transcoding = settings.transcoding;
        }
        return GetAsParams({
            ...this.GetBasicParams(),
            id: currentTrack.id,
            format: transcoding,
            estimateContentLength:
                settings.transcoding !== "" ? "true" : "false",
        });
    };

    async _playCurrent() {
        if ("mediaSession" in navigator) {
            let albumArt = "";
            const ret = await this.getAlbumArt({
                id: this.currentTrack.albumId,
            });
            if (ret.status === "ok") {
                albumArt = ret.value!;
            }
            navigator.mediaSession.metadata = new MediaMetadata({
                title: this.currentTrack.title,
                artist: this.currentTrack.artist,
                album: this.currentTrack.album,
                artwork: [{ src: albumArt, sizes: "any" }],
            });
        }
        await this.notifyListeners("currentTrack", {
            currentTrack: this.currentTrack,
        });
        this.scrobble();
        this.audio.src = `${
            this.context.activeAccount.url
        }/rest/stream?${this.getSongParams(this.currentTrack)}`;
        await this.audio.play();
    }

    _prev() {
        if (this.currentPlaylist.entry.indexOf(this.currentTrack) !== 0) {
            this.currentTrack =
                this.currentPlaylist.entry[
                    this.currentPlaylist.entry.indexOf(this.currentTrack) - 1
                ];
            this._playCurrent();
        }
    }

    async prev(): Promise<IBackendResponse<string>> {
        this._prev();
        return this.OKResponse("");
    }

    _next() {
        if (
            this.currentPlaylist.entry.indexOf(this.currentTrack) !==
            this.currentPlaylist.entry.length - 1
        ) {
            this.currentTrack =
                this.currentPlaylist.entry[
                    this.currentPlaylist.entry.indexOf(this.currentTrack) + 1
                ];
            this._playCurrent();
        }
    }

    async next(): Promise<IBackendResponse<string>> {
        this._next();
        return this.OKResponse("");
    }

    setVolume(options: { volume: number }): Promise<IBackendResponse<string>> {
        this.audio.volume = options.volume;
        return Promise.resolve(this.OKResponse(""));
    }

    seek(options: { time: number }): Promise<IBackendResponse<string>> {
        console.log(options.time);
        this.audio.currentTime = options.time * this.currentTrack.duration;
        return Promise.resolve(this.OKResponse(""));
    }

    removeTrailingSlash(str: string) {
        return str.replace(/\/+$/, "");
    }

    OKResponse<T>(value: T) {
        return {
            status: "ok",
            error: "",
            value: value,
        };
    }

    ErrorResponse(error?: string) {
        return {
            status: "error",
            error: error ?? "There was an error.",
            value: null,
        };
    }

    removeAllListeners(): Promise<void> {
        super.removeAllListeners();
        return Promise.resolve();
    }
}

// This started as an audio backend, but is gonna mutate into a full audio-subsonic backend
// In time.

import {
  WebPlugin,
} from "@capacitor/core";
import axios from "axios";
import md5 from "js-md5";
import qs from "qs";
import { IBasicParams } from "../Models/API/Requests/BasicParams";
import { IAlbumsResponse } from "../Models/API/Responses/IAlbumsResponse";
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
} from "../Models/API/Responses/IArtistResponse";
import { IArtistsResponse } from "../Models/API/Responses/IArtistsResponse";
import { ISubsonicResponse } from "../Models/API/Responses/SubsonicResponse";
import { IAccount, IAppContext } from "../Models/AppContext";
import { IBackendPlugin, IBackendResponse, ICurrentState, ISettings } from "./VLC";

export class Backend extends WebPlugin implements IBackendPlugin {
  playlist: IAlbumSongResponse[];
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

    this.playlist = [];
    this.audio = new Audio();
    this.isPlaying = false;

    this.audio.onplay = () => {
      if (this.listeners["play"]) {
        this.isPlaying = true;
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing";
        }
        this.notifyListeners("play", null);
      }
    };
    this.audio.onpause = () => {
      if (this.listeners["paused"]) {
        this.isPlaying = false;
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused";
        }
        this.notifyListeners("paused", null);
      }
    };
    this.audio.ontimeupdate = (ev: any) => {
      if (this.listeners["progress"]) {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.setPositionState({
            duration: ev.path[0].duration,
            playbackRate: 1,
            position: ev.path[0].currentTime * ev.path[0].duration,
          });
        }
        this.notifyListeners("progress", {
          time: ev.path[0].currentTime / ev.path[0].duration,
        });
      }
    };
    this.audio.onended = () => {
      if (this.listeners["stopped"]) {
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "none";
        }
        this.notifyListeners("stopped", null);
      }
      this._next();
    };
  }
  getSettings(): Promise<IBackendResponse<ISettings>> {
    throw new Error("Method not implemented.");
  }
  setSettings(options: ISettings): Promise<IBackendResponse<String>> {
    throw new Error("Method not implemented.");
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
  getActiveAccount(): Promise<IBackendResponse<IAccount>> {
    return Promise.resolve(this.OKResponse(this.context.activeAccount));
  }

  deleteAccount(options: { url: string }): Promise<IBackendResponse<string>> {
    this.context = {
      activeAccount: this.context.activeAccount,
      spotifyToken: this.context.spotifyToken,
      accounts: this.context.accounts.filter((s) => s.url !== options.url),
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
      { params: { ...params, type: type ?? "frequent", size: size ?? 10 } }
    );
    if (ret?.status === 200) {
      if (ret?.data["subsonic-response"]?.status === "ok") {
        return this.OKResponse(ret.data["subsonic-response"]!.albumList2.album);
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
    const ret = await axios.get<{ "subsonic-response": IRandomSongsResponse }>(
      `${this.context.activeAccount.url}/rest/getRandomSongs`,
      { params: { ...this.GetBasicParams(), size: 10 } }
    );
    if (ret?.status === 200) {
      if (ret?.data["subsonic-response"]?.status === "ok") {
        return this.OKResponse(ret.data["subsonic-response"].randomSongs.song);
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
        `${this.context.activeAccount.url}/rest/getCoverArt?${this.getAsParams({
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
              },
            },
          });
        }
      }
    } else {
      this.setContext({
        context: {
          activeAccount: { username: null, password: "", url: "", type: "" },
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
  }): Promise<IBackendResponse<IAccount>> {
    const uuid = "abcd1234";
    const hash = md5(`${options.password}${uuid}`);
    const basicParams: IBasicParams = {
      u: options.username,
      t: hash,
      s: uuid,
      v: "1.16.1",
      c: "soniclair",
      f: "json",
    };
    let newContext: IAppContext = {
      activeAccount: { username: null, password: "", url: "", type: "" },
      accounts: [],
      spotifyToken: "",
    };

    try {
      const ret = await axios.get<{ "subsonic-response": ISubsonicResponse }>(
        `${options.url}/rest/getArtists`,
        { params: basicParams }
      );
      if (
        ret?.status === 200 &&
        ret?.data["subsonic-response"]?.status === "ok"
      ) {
        const creds = {
          username: options.username,
          password: options.password,
          url: this.removeTrailingSlash(options.url),
          type: ret.data["subsonic-response"].type,
        };
        if (
          this.context!.accounts.filter((s) => s.url === options.url).length ===
          1
        ) {
          newContext = {
            activeAccount: creds,
            accounts: [
              ...this.context.accounts.filter((s) => s.url !== options.url),
              creds,
            ],
            spotifyToken: await this.getSpotifyToken(),
          };
          await this.setContext({ context: newContext });
          localStorage.setItem("serverCreds", JSON.stringify(newContext));
        } else {
          newContext = {
            activeAccount: creds,
            accounts: [...this.context.accounts, creds],
            spotifyToken: await this.getSpotifyToken(),
          };
          await this.setContext({ context: newContext });
          localStorage.setItem("serverCreds", JSON.stringify(newContext));
        }
      } else if (ret?.data["subsonic-response"]?.status === "failed") {
        return this.ErrorResponse(
          ret?.data["subsonic-response"]?.error?.message!
        );
      }
    } catch (e) {
      return this.ErrorResponse("There was an error connecting to the server.");
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
        t: hash,
        s: uuid,
        v: "1.16.1",
        c: "soniclair",
        f: "json",
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
      f: "json",
    };
  }

  async getSimilarSongs(options: {
    id: string;
  }): Promise<IBackendResponse<IAlbumSongResponse[]>> {
    const ret = await axios.get<{ "subsonic-response": ISimilarSongsResponse }>(
      `${this.context.activeAccount.url}/rest/getSimilarSongs2`,
      { params: { ...this.GetBasicParams(), size: 10, id: options.id } }
    );
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

  async playAlbum(options: {
    album: string;
    track: number;
  }): Promise<IBackendResponse<string>> {
    const album = await this.getAlbum({ id: options.album });
    if (album.status !== "ok") {
      return this.ErrorResponse(album.error);
    }
    this.playlist = album.value!.song;
    this.currentTrack = this.playlist[options.track];
    this._playCurrent();
    return Promise.resolve(this.OKResponse(""));
  }

  async playRadio(options: {
    song: string;
  }): Promise<IBackendResponse<string>> {
    const album = await this.getSimilarSongs({ id: options.song });
    if (album.status !== "ok") {
      return this.ErrorResponse(album.error);
    }
    this.playlist = album.value!;
    this.currentTrack = this.playlist[0];
    this._playCurrent();
    return this.OKResponse("");
  }

  async getArtists(): Promise<IBackendResponse<IArtistsResponse>> {
    const ret = await axios.get<{ "subsonic-response": IArtistsResponse }>(
      `${this.context!.activeAccount.url}/rest/getArtists`,
      { params: this.GetBasicParams() }
    );
    if (ret?.status === 200) {
      if (ret?.data["subsonic-response"]?.status === "ok") {
        return this.OKResponse(ret.data["subsonic-response"]);
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
      const ret = await axios.get<{ "subsonic-response": IAlbumsResponse }>(
        `${this.context!.activeAccount.url}/rest/getAlbumList2`,
        {
          params: {
            ...params,
            type: "alphabeticalByName",
            size: 500,
            offset: page * 500,
          },
        }
      );
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
          if (ret.data["subsonic-response"].albumList2.album.length < 500) {
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
    const ret = await axios.get<{ "subsonic-response": IArtistInfoResponse }>(
      `${this.context!.activeAccount.url}/rest/getArtistInfo2`,
      { params: params }
    );
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

  async play(): Promise<IBackendResponse<string>> {
    if (this.currentTrack && !this.isPlaying) {
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
    if ("mediaSession" in navigator) {
      let albumArt = "";
      const ret = await this.getAlbumArt({ id: this.currentTrack.albumId });
      if (ret.status === "ok") {
        albumArt = ret.value!;
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentTrack.title,
        artist: this.currentTrack.artist,
        album: this.currentTrack.album,
        artwork: [{ src: albumArt, sizes: "any" }],
      });
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
    await this.notifyListeners("currentTrack", {
      currentTrack: this.currentTrack,
    });
    this.audio.src = `${
      this.context.activeAccount.url
    }/rest/stream?${this.getSongParams(this.currentTrack)}`;
    await this.audio.play();
  }

  _prev() {
    if (this.playlist.indexOf(this.currentTrack) !== 0) {
      this.currentTrack =
        this.playlist[this.playlist.indexOf(this.currentTrack) - 1];
      this._playCurrent();
    }
  }

  async prev(): Promise<IBackendResponse<string>> {
    this._prev();
    return this.OKResponse("");
  }

  _next() {
    if (this.playlist.indexOf(this.currentTrack) !== this.playlist.length - 1) {
      this.currentTrack =
        this.playlist[this.playlist.indexOf(this.currentTrack) + 1];
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
    this.audio.currentTime = options.time * this.audio.duration;
    return Promise.resolve(this.OKResponse(""));
  }

  removeTrailingSlash(str: string) {
    return str.replace(/\/+$/, "");
  }

  getAsParams(data: any): string {
    return new URLSearchParams(data).toString();
  }

  OKResponse<T>(value: T) {
    return {
      status: "ok",
      error: "",
      value: value,
    };
  }

  ErrorResponse<T>(error?: string) {
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

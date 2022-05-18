import { Dispatch, SetStateAction } from "react";
import { IAlbumSongResponse } from "./API/Responses/IArtistResponse";

export interface IAppContext {
    username: string;
    password: string;
    url: string;
}

export interface IAudioContext{
    audio: HTMLAudioElement;
    
}
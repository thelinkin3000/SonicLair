import { ISubsonicResponse } from "./SubsonicResponse";

export interface IArtistResponse extends ISubsonicResponse {
    artist: {
        id: number;
        name: string;
        coverArt: string;
        albumCount: number;
        album: IAlbumArtistResponse[];
    }

}

export interface IAlbumArtistResponse {
    id: string;
    name: string;
    coverArt: string;
    songCount: number;
    created: string;
    duration: number;
    artist: string;
    artistId: number;

}

export interface IAlbumResponse extends ISubsonicResponse {
    album: IInnerAlbumResponse;
}

export interface IInnerAlbumResponse extends IAlbumArtistResponse {
    song: IAlbumSongResponse[];
}


export interface IAlbumSongResponse {
    id: number;
    parent: number;
    title: string;
    duration: number;
    track: number;
}


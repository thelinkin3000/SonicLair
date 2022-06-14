import { ISubsonicResponse } from "./SubsonicResponse";

export interface IArtistResponse extends ISubsonicResponse {
    artist: IInnerArtistResponse

}

export interface IInnerArtistResponse {
    id: string;
    name: string;
    coverArt: string;
    albumCount: number;
    album: IAlbumArtistResponse[];
}

export interface IRandomSongsResponse extends ISubsonicResponse {
    randomSongs: { song: IAlbumSongResponse[] };
}

export interface ISimilarSongsResponse extends ISubsonicResponse {
    similarSongs2: { song: IAlbumSongResponse[] };
}

export interface IAlbumArtistResponse {
    id: string;
    name: string;
    coverArt: string;
    songCount: number;
    created: string;
    duration: number;
    artist: string;
    artistId: string;
    year: number;
}

export interface IAlbumResponse extends ISubsonicResponse {
    album: IInnerAlbumResponse;
}

export interface IInnerAlbumResponse extends IAlbumArtistResponse {
    song: IAlbumSongResponse[];
}

export interface ISongResponse extends ISubsonicResponse{
    song: IAlbumSongResponse;
}

export interface IAlbumSongResponse {
    id: string;
    parent: string;
    title: string;
    duration: number;
    track: number;
    artist: string;
    album: string;
    albumId: string;
    coverArt: string;
}


import { IArtist } from "./IArtist";
import { IAlbumArtistResponse, IAlbumResponse, IAlbumSongResponse, IInnerArtistResponse } from "./IArtistResponse";
import { ISubsonicResponse } from "./SubsonicResponse";


export interface IArtistInfoResponse extends ISubsonicResponse {
    artistInfo2: IArtistInfo;
}

export interface IArtistInfo {
    biography: string;
    largeImageUrl: string;
    smallImageUrl: string;
    mediumImageUrl: string;
}


export interface ISearchResponse extends ISubsonicResponse {
    searchResult3: ISearchResult;
}

export interface ISearchResult{
    album?: IAlbumArtistResponse[];
    artist?: IArtist[];
    song?: IAlbumSongResponse[];
}
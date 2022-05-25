import { IArtist } from "./IArtist";
import { IAlbumArtistResponse, IAlbumResponse, IAlbumSongResponse, IInnerArtistResponse } from "./IArtistResponse";
import { ISubsonicResponse } from "./SubsonicResponse";


export interface IArtistInfoResponse extends ISubsonicResponse {
    artistInfo2: {
        biography: string;
        largeImageUrl: string;
        smallImageUrl: string;
        mediumImageUrl: string;
    };
}


export interface ISearchResponse extends ISubsonicResponse {
    searchResult3: {
        album?: IAlbumArtistResponse[];
        artist?: IArtist[];
        song?: IAlbumSongResponse[];
    }
}
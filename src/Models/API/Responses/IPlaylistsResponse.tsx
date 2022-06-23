import { IAlbumSongResponse } from "./IArtistResponse";
import { ISubsonicResponse } from "./SubsonicResponse";

export interface IPlaylistsResponse extends ISubsonicResponse {
    playlists: { playlist: IPlaylist[] };
}

export interface IPlaylist {
    id: string;
    name: string;
    comment: string;
    owner: string;
    public: boolean;
    songCount: number;
    duration: number;
    created: string;
    coverArt: string;
    entry: IAlbumSongResponse[];
}

export interface IPlaylistResponse extends ISubsonicResponse {
    playlist: IPlaylist;
}

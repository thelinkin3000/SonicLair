import { ISubsonicResponse } from "./SubsonicResponse";
import { IArtistIndex } from "./Index";
import { IAlbumArtistResponse, IAlbumResponse } from "./IArtistResponse";


export interface IAlbumsResponse extends ISubsonicResponse {
    albumList2: {
        album: IAlbumArtistResponse[];
    };
}

import { ISubsonicResponse } from "./SubsonicResponse";
import { IAlbumArtistResponse } from "./IArtistResponse";

export interface IAlbumsResponse extends ISubsonicResponse {
    albumList2: {
        album: IAlbumArtistResponse[];
    };
}

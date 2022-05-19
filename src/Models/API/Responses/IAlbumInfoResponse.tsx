import { ISubsonicResponse } from "./SubsonicResponse";


export interface IAlbumInfoResponse extends ISubsonicResponse {
    albumInfo: {
        notes: string;
        musicBrainzId: string;
        lastFmUrl: string;
    };
}

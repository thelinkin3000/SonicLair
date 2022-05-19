import { ISubsonicResponse } from "./SubsonicResponse";


export interface IArtistInfoResponse extends ISubsonicResponse {
    artistInfo: {
        biography: string;
        largeImageUrl: string;
        smallImageUrl: string;
        mediumImageUrl: string;
    };
}



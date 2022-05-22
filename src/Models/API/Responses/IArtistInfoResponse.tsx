import { ISubsonicResponse } from "./SubsonicResponse";


export interface IArtistInfoResponse extends ISubsonicResponse {
    artistInfo2: {
        biography: string;
        largeImageUrl: string;
        smallImageUrl: string;
        mediumImageUrl: string;
    };
}



import { ISubsonicResponse } from "./SubsonicResponse";
import { IArtistIndex } from "./Index";

export interface IArtistsResponse extends ISubsonicResponse {
    artists: {
        ignoredArticles: string;
        index: IArtistIndex[];
    };
}


import { IAppContext } from "../Models/AppContext";
import { IArtistsResponse } from "../Models/API/Responses/IArtistsResponse";
import axios from "axios";
import GetBasicParams from "./GetBasicParams";
import { IRandomSongsResponse, ISimilarSongsResponse } from "../Models/API/Responses/IArtistResponse";


export default async function GetSimilarSongs(context: IAppContext, id: string): Promise<ISimilarSongsResponse> {
    const ret = await axios.get<{ "subsonic-response": ISimilarSongsResponse }>(`${context.activeAccount.url}/rest/getSimilarSongs2`, { params: { ...GetBasicParams(context), size: 10, id:id } });
    if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
        return Promise.resolve(ret.data["subsonic-response"]);
    }
    else {
        throw new Error("Ocurrió un error");
        // TODO DISPLAY MESSAGE ERROR
    }
}



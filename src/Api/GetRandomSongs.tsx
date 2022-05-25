import { IAppContext } from "../Models/AppContext";
import { IArtistsResponse } from "../Models/API/Responses/IArtistsResponse";
import axios from "axios";
import GetBasicParams from "./GetBasicParams";
import { IRandomSongsResponse } from "../Models/API/Responses/IArtistResponse";


export default async function GetRandomSongs(context: IAppContext): Promise<IRandomSongsResponse> {
    const ret = await axios.get<{"subsonic-response":IRandomSongsResponse}>(`${context.activeAccount.url}/rest/getRandomSongs`,{params: {...GetBasicParams(context), size:10}});
        if(ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok"){
            return Promise.resolve(ret.data["subsonic-response"]);
        }
        else{
            throw new Error("Ocurrió un error");
            // TODO DISPLAY MESSAGE ERROR
        }
}



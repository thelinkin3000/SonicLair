import { IAppContext } from "../Models/AppContext";
import { IArtistsResponse } from "../Models/API/Responses/IArtistsResponse";
import axios from "axios";
import GetBasicParams from "./GetBasicParams";


export default async function GetArtists(context: IAppContext): Promise<IArtistsResponse> {
    const ret = await axios.get<{"subsonic-response":IArtistsResponse}>(`${context.url}/rest/getArtists`,{params: GetBasicParams(context)});
        if(ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok"){
            return Promise.resolve(ret.data["subsonic-response"]);
            // useNavigate("/artists");
        }
        else{
            throw new Error("Ocurrió un error");
            // TODO DISPLAY MESSAGE ERROR
        }
}



import axios from "axios";
import { IArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { IAppContext } from "../Models/AppContext";
import GetBasicParams from "./GetBasicParams";

export default async function GetArtist(context: IAppContext, id: string): Promise<IArtistResponse> {
    const params = {...GetBasicParams(context), id: id};
    const ret = await axios.get<{"subsonic-response":IArtistResponse}>(`${context.activeAccount.url}/rest/getArtist`,{params: params});
        if(ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok"){
            return Promise.resolve(ret.data["subsonic-response"]);
            // useNavigate("/artists");
        }
        else{
            throw new Error("Ocurrió un error");
            // TODO DISPLAY MESSAGE ERROR
        }
}


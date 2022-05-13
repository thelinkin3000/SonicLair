import axios from "axios";
import { IAlbumResponse, IArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { IAppContext } from "../Models/AppContext";
import GetBasicParams from "./GetBasicParams";

export default async function GetAlbum(context: IAppContext, id: string): Promise<IAlbumResponse> {
    const params = {...GetBasicParams(context), id: id};
    const ret = await axios.get<{"subsonic-response":IAlbumResponse}>(`${context.url}/rest/getAlbum`,{params: params});
        if(ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok"){
            console.log(ret.data);
            return Promise.resolve(ret.data["subsonic-response"]);
            // useNavigate("/artists");
        }
        else{
            throw new Error("Ocurrió un error");
            // TODO DISPLAY MESSAGE ERROR
        }
}


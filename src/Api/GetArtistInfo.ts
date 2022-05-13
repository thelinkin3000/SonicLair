import axios from "axios";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import { IAppContext } from "../Models/AppContext";
import GetBasicParams from "./GetBasicParams";

export default async function GetArtistInfo(context: IAppContext, id: string): Promise<IArtistInfoResponse> {
    const params = { ...GetBasicParams(context), id: id };
    const ret = await axios.get<{ "subsonic-response": IArtistInfoResponse }>(`${context.url}/rest/getArtistInfo`, { params: params });
    if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
        console.log(ret.data);
        return Promise.resolve(ret.data["subsonic-response"]);
        // useNavigate("/artists");
    }
    else {
        throw new Error("Ocurrió un error");
        // TODO DISPLAY MESSAGE ERROR
    }
}
import axios from "axios";
import { IArtistInfoResponse, ISearchResponse } from "../Models/API/Responses/IArtistInfoResponse";
import { IAppContext } from "../Models/AppContext";
import GetBasicParams from "./GetBasicParams";

export default async function SearchBackend(context: IAppContext, query: string): Promise<ISearchResponse> {
    const params = { ...GetBasicParams(context), query: query };
    const ret = await axios.get<{ "subsonic-response": ISearchResponse}>(`${context.activeAccount.url}/rest/search3`, { params: params });
    if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
        return Promise.resolve(ret.data["subsonic-response"]);
        // useNavigate("/artists");
    }
    else {
        throw new Error("Ocurrió un error");
        // TODO DISPLAY MESSAGE ERROR
    }
}


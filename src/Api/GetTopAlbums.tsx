import { IAppContext } from "../Models/AppContext";
import axios from "axios";
import GetBasicParams from "./GetBasicParams";
import { IAlbumsResponse } from "../Models/API/Responses/IAlbumsResponse";


export default async function GetTopAlbums(context: IAppContext): Promise<IAlbumsResponse> {
    const params = GetBasicParams(context);
    const ret = await axios.get<{ "subsonic-response": IAlbumsResponse; }>(`${context.activeAccount.url}/rest/getAlbumList2`, { params: { ...params, type: "frequent", size: 10 } });
    if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
        return Promise.resolve(ret.data["subsonic-response"]!);
    }
    else {
        throw new Error("Ocurrió un error");
        // TODO DISPLAY MESSAGE ERROR
    }
}

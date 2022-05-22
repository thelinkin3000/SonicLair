import { IAppContext } from "../Models/AppContext";
import { IArtistsResponse } from "../Models/API/Responses/IArtistsResponse";
import axios from "axios";
import GetBasicParams from "./GetBasicParams";
import { IAlbumsResponse } from "../Models/API/Responses/IAlbumsResponse";


export default async function GetAlbums(context: IAppContext): Promise<IAlbumsResponse> {
    let more: boolean = true;
    let albumsResponse: IAlbumsResponse | null = null;
    const params = GetBasicParams(context);
    let page = 0;
    while (more) {
        const ret = await axios.get<{ "subsonic-response": IAlbumsResponse; }>(`${context.url}/rest/getAlbumList2`, { params: { ...params, type: "alphabeticalByName", size: 500, offset: page * 500 } });
        if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
            if (albumsResponse === null) {
                albumsResponse = ret.data["subsonic-response"];
            }
            else {
                albumsResponse.albumList2.album = [...albumsResponse.albumList2.album, ...ret.data["subsonic-response"].albumList2.album];
            }
            page++;
            if (ret.data["subsonic-response"].albumList2.album.length < 500) {
                more = false;
            }
        }
        else {
            throw new Error("Ocurrió un error");
            // TODO DISPLAY MESSAGE ERROR
        }
    }
    return Promise.resolve(albumsResponse!);
}

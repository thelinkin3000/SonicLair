import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { GetAsParams, SecondsToHHSS } from "../Helpers";
// With the Tauri API npm package:
import { invoke } from '@tauri-apps/api/tauri'
import { IAppContext, IAudioContext } from "../Models/AppContext";
import GetBasicParams from "../Api/GetBasicParams";
import PlayTest from "./PlayTest";

export default function SongItem({ item, context, audioContext }: { item: IAlbumSongResponse, context: IAppContext, audioContext: IAudioContext }) {
    const getParams = () => {
        return GetAsParams({ ...GetBasicParams(context), id: item.id });
    };
    const play = () => {
        audioContext.audio.pause();
        audioContext.audio.src = `${context.url}/rest/stream?${getParams()}`;
        audioContext.audio.play();
    }
    return (
        <div className="list-group-item" onClick={() => play()}>
            <div className="row">
                <div className="col-auto">{item.track}</div>
                <div className="col">{item.title}</div>
                <div className="col-auto">{SecondsToHHSS(item.duration)}</div>
            </div>

        </div>
    )
}
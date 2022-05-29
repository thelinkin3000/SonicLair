import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { SecondsToHHSS } from "../Helpers";
// With the Tauri API npm package:
import { useCallback, useContext, useRef } from "react";
import { CurrentTrackContext } from "../AudioContext";
import classNames from "classnames";
import "./SongItem.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { MenuContext } from "../AppContext";
import VLC from "../Plugins/VLC";
import { Toast } from "@capacitor/toast";


export default function SongItem({ item }: { item: IAlbumSongResponse }) {
    const { currentTrack } = useContext(CurrentTrackContext);
    const listeners = useRef<{ event: string, listener: (ev: any) => void }[]>([]);
    const { setMenuContext } = useContext(MenuContext);
    const playRadio = useCallback(async () => {
        const s = await VLC.playRadio({ song: item.id });
        if (s.status === "error") {
            await Toast.show({ text: s.error });
        }

    }, [item]);
    const play = useCallback(async () => {
        const s = await VLC.playAlbum({ album: item.albumId, track: item.track - 1 });
        if (s.status === "error") {
            await Toast.show({ text: s.error });
        }

    }, [item]);

    const ref = (r: HTMLDivElement) => {
        if (r) {
            listeners.current.forEach(element => {
                r.removeEventListener(element.event, element.listener);
            });
            listeners.current.splice(0, listeners.current.length);
            const func = (ev: any) => {
                setMenuContext({
                    x: ev.pageX,
                    y: ev.pageY,
                    show: true,
                    body: (<button className="btn btn-primary" onClick={() => { playRadio() }}>Start radio</button>)

                })
            };
            r.addEventListener("contextmenu", func);
            listeners.current.push({ event: "contextmenu", listener: func })
        }
    };
    return (
        <div ref={ref} className={classNames("list-group-item", currentTrack.id === item.id && "highlight", "not-selectable")} onClick={() => play()}>
            <div className="row">
                <div className="col-auto">{item.track}</div>
                <div className="col">{currentTrack.id === item.id && <FontAwesomeIcon icon={faVolumeHigh} />}  {item.title}</div>
                <div className="col-auto">{SecondsToHHSS(item.duration)}</div>
            </div>
        </div>
    )
}

function IAppContext(IAppContext: any): { context: any; } {
    throw new Error("Function not implemented.");
}

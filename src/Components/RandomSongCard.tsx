import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { GetAsParams } from "../Helpers";
import GetBasicParams from "../Api/GetBasicParams";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppContext, MenuContext } from "../AppContext";
import GetSimilarSongs from "../Api/GetSimilarSongs";
import { CurrentTrackContext } from "../AudioContext";
import { Toast } from "@capacitor/toast";
import VLC from "../Plugins/VLC";
import _ from "lodash";


export default function RandomSongCard({ item }: { item: IAlbumSongResponse }) {
    const { context } = useContext(AppContext);
    const { setMenuContext } = useContext(MenuContext);
    const listeners = useRef<{ event: string, listener: (ev: any) => void }[]>([]);

    const { setPlaylistAndPlay } = useContext(CurrentTrackContext);
    const getCoverArtParams = useCallback(() => {
        return GetAsParams({ ...GetBasicParams(context), id: item.albumId });
    }, [context, item]);

    const [songs, setSongs] = useState<IAlbumSongResponse[]>([]);
    const getSongParams = useCallback((currentTrack: IAlbumSongResponse) => {
        return GetAsParams({ ...GetBasicParams(context), id: currentTrack.id });
    }, [context]);
    const playSongOnVlc = useCallback(async () => {
        const ret = await VLC.play({ uri: `${context.activeAccount.url}/rest/stream?${getSongParams(item)}` });
        console.log("VLC RESULT", ret);

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
                    body: (<button className="btn btn-primary" onClick={() => { playSongOnVlc() }}>Play on VLC</button>)
                })
            };
            r.addEventListener("contextmenu", func);
            listeners.current.push({ event: "contextmenu", listener: func })
        }
    };

    useEffect(() => {
        if (context.accounts.length < 1)
            return;
        const fetch = async () => {
            const s = await GetSimilarSongs(context, item.id);
            setSongs(s.similarSongs2.song);
        }
        fetch();
    }, [context]);

    const play = useCallback(async () => {
        if (songs.length > 0) {
            setPlaylistAndPlay([item, ...songs], 0);
        }
        else {
            await Toast.show({
                text: 'The server did not report similar songs for this track.',
            });
        }
    }, [songs, setPlaylistAndPlay]);



    return (
        <div ref={ref} className="list-group-item d-flex flex-column align-items-center justify-content-between album-item"
            onClick={() => play()}>
            <div className="d-flex align-items-center justify-content-center album-image-container">
                <img src={`${context.activeAccount.url}/rest/getCoverArt?${getCoverArtParams()}`} className="album-image"></img>
            </div>
            <div className=" d-flex flex-column align-items-start justify-content-end text-white no-overflow">
                <span>
                    {item.title}
                </span>
                <span>
                    by {item.artist}
                </span>
            </div>

        </div>
    )
}
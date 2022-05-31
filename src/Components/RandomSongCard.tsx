import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import { Toast } from "@capacitor/toast";
import VLC from "../Plugins/VLC";
import _ from "lodash";
import Loading from "./Loading";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import classNames from "classnames";


export default function RandomSongCard({ item }: { item: IAlbumSongResponse }) {
    const { context } = useContext(AppContext);
    const [coverArt, setCoverArt] = useState<string>("");
    useEffect(() => {
        const func = async () => {
            const s = await VLC.getAlbumArt({ id: item.albumId });
            if (s.status === "ok") {
                setCoverArt(s.value!);
            }
            // We don't show a toast here because it would flood the UI with meaningless errors
        }
        func();
    }, [item]);
    
    const play = useCallback(async () => {
        const ret = await VLC.playRadio({ song: item.id });
        if (ret.status === "error") {
            await Toast.show({ text: ret.error });
        }
    }, [item]);
    const { focused, ref } = useFocusable({onEnterPress: play});
    useEffect(() => {
        if(focused){
            ref.current.scrollIntoView();
        }
    },[focused]);
    return (
        <div ref={ref} className={classNames("d-flex","flex-column","align-items-center","justify-content-between", focused ? "album-item-focused" : "","album-item")}
            onClick={() => play()}>
            <div className="d-flex align-items-center justify-content-center album-image-container">
                {coverArt === "" ? <Loading></Loading> : <img src={coverArt} className="album-image"></img>}
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
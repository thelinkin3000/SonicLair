import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { IAlbumArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { useCallback, useEffect, useState } from "react";
import Loading from "./Loading";
import VLC from "../Plugins/VLC";
import classnames from "classnames";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";

export default function AlbumCard({ item, forceWidth, parentRef }:
    { item: IAlbumArtistResponse, forceWidth: boolean | undefined, parentRef?: React.RefObject<any> }) {
    const navigate = useNavigate();
    const [coverArt, setCoverArt] = useState<string>("");

    useEffect(() => {
        const func = async () => {
            const ret = await VLC.getAlbumArt({ id: item.id });
            if (ret.status === "ok") {
                setCoverArt(ret.value!);
            }
        };
        if (coverArt === "") {
            func();
        }

    }, [coverArt])

    const [style, setStyle] = useState<any>({});
    const onload = (ev: any) => {
        if (!ref.current)
            return;
        if (ev.target.height > ev.target.width && ev.target.height > ref!.current.clientWidth - 10) {
            setStyle({ width: "auto", height: `${ref!.current.clientWidth - 10}px` })
        }
    };
    const play = useCallback(() => {
        VLC.playAlbum({ album: item.id, track: 0 });
        navigate("/playing");
    }, [item]);
    const { focused, ref } = useFocusable({ onEnterPress: play });
    useEffect(() => {
        if (focused) {
            parentRef?.current.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
            ref.current.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        }
    }, [focused]);

    return (
        <div
            ref={ref}
            style={forceWidth ? { width: "170px" } : {}}
            className={classnames("d-flex", "flex-column", "align-items-center", "justify-content-between", "album-item", focused ? "album-item-focused" : "")}
            onClick={() => navigate(`/album`, { state: { id: item.id } })}>
            <div className="d-flex align-items-center justify-content-center album-image-container">
                {coverArt === "" ? <Loading></Loading> : <img style={style} onLoad={onload} src={coverArt} className="album-image"></img>}

            </div>
            <div className=" d-flex flex-column align-items-start justify-content-end text-white no-overflow w-100">
                <span>
                    {item.name}
                </span>
                <span>
                    {item.year}
                </span>
            </div>

        </div>
    )
}


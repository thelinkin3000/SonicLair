import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { IAlbumArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { useCallback, useContext, useEffect, useState } from "react";
import Loading from "./Loading";
import VLC from "../Plugins/VLC";
import classnames from "classnames";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { Column } from "react-virtualized";
import { StateContext } from "../AppContext";

interface AlbumCardProps { 
    item: IAlbumArtistResponse, 
    forceWidth: boolean | undefined, 
    parentRef?: React.RefObject<any>,
    columnIndex?: number,
    rowIndex?: number }

export default function AlbumCard({ item, forceWidth, parentRef, columnIndex, rowIndex }: AlbumCardProps) {
    const navigate = useNavigate();
    const [coverArt, setCoverArt] = useState<string>("");
    const {stateContext, setStateContext} = useContext(StateContext);
    
    useEffect(() => {
        const func = async () => {
            const ret = await VLC.getAlbumArt({ id: item.id });
            if (ret.status === "ok") {
                setCoverArt(ret.value!);
            }
        };
        func();

    }, [coverArt, item])

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
            parentRef?.current.scrollIntoView({ behavior: "smooth", block: "end", inline: "center" });
            ref.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
    }, [focused]);

    const nav = useCallback(() => {
        if(columnIndex !== undefined && rowIndex !== undefined){
            setStateContext({...stateContext, selectedAlbum: [rowIndex, columnIndex]})
        }
        navigate(`/album`, { state: { id: item.id } })

    },[item, rowIndex, columnIndex, setStateContext, stateContext]);

    return (
        <div
            ref={ref}
            style={forceWidth ? { width: "170px" } : {}}
            className={classnames("d-flex", "flex-column", "align-items-center", "justify-content-between", "album-item", focused ? "album-item-focused" : "")}
            onClick={nav}>
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


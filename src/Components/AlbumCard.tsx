import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { IAlbumArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { useEffect, useState } from "react";
import Loading from "./Loading";
import VLC from "../Plugins/VLC";
import classnames from "classnames";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";

export default function AlbumCard({ item, forceWidth }: { item: IAlbumArtistResponse, forceWidth: boolean | undefined }) {
    const navigate = useNavigate();
    const [coverArt, setCoverArt] = useState<string>("");
    const { focused, ref} = useFocusable();
    useEffect(() => {
        if(focused){
            ref.current.scrollIntoView();
        }
    },[focused]);
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


    return (
        <div
            ref={ref}
            style={forceWidth ? { width: "170px" } : {}}
            className={classnames("d-flex","flex-column","align-items-center","justify-content-between","album-item", focused ? "album-item-focused" : "")}
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


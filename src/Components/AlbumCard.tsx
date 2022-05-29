import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { IAlbumArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { GetAsParams } from "../Helpers";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppContext, MenuContext } from "../AppContext";
import { CurrentTrackContext } from "../AudioContext";
import Loading from "./Loading";
import VLC from "../Plugins/VLC";

export default function AlbumCard({ item, forceWidth }: { item: IAlbumArtistResponse, forceWidth: boolean | undefined }) {
    const navigate = useNavigate();
    const { context } = useContext(AppContext);
    const listeners = useRef<{ event: string, listener: (ev: any) => void }[]>([]);
    const { setMenuContext } = useContext(MenuContext);
    const { currentTrack, setPlaylistAndPlay } = useContext(CurrentTrackContext);
    const [containerRef, setContainerRef] = useState<HTMLDivElement>();
    const [coverArt, setCoverArt] = useState<string>("");
    const ref = (r: HTMLDivElement) => {
        setContainerRef(r);
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
                    body: (<button className="btn btn-primary" onClick={() => console.log("clicked")}>Play album!</button>)

                })
            };
        }
    };

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
    const onload = useCallback((ev: any) => {
        if (!containerRef)
            return;
        if (ev.target.height > ev.target.width && ev.target.height > containerRef!.clientWidth - 10) {
            setStyle({ width: "auto", height: `${containerRef!.clientWidth - 10}px` })
        }
    }, [containerRef]);


    return (
        <div
            ref={ref}
            style={forceWidth ? { width: "170px" } : {}}
            className="list-group-item d-flex flex-column align-items-center justify-content-between album-item"
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
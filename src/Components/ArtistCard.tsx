import { IArtist } from "../Models/API/Responses/IArtist";
import "./ArtistCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import GetArtistInfo from "../Api/GetArtistInfo";
import { AppContext } from "../AppContext";
import useVisible from "../Hooks/useVisible";
import Loading from "./Loading";
import GetSpotifyArtist from "../Api/GetSpotifyArtist";
export default function ArtistCard({ item, forceWidth }: { item: IArtist, forceWidth?: boolean}) {
    const navigate = useNavigate();
    const [artistFetched, setArtistFetched] = useState<boolean>(false);
    const { context } = useContext(AppContext);
    const ref = useRef<HTMLDivElement>(null);
    const [coverArt, setCoverArt] = useState<string>("");
    const [style, setStyle] = useState<any>({});
    useEffect(() => {
        const fetch = async () => {
            const items = await GetSpotifyArtist(context.spotifyToken,item.name);
            if(items.length > 0 && items[0].name === item.name){
                setCoverArt(items[0].images[0].url);
            }
            else{
                const ret = await GetArtistInfo(context, item.id);
                setCoverArt(ret.artistInfo2.largeImageUrl);
            }
        }
        if (context.activeAccount.url !== "" && context.spotifyToken !== undefined) {
            const handler = setTimeout(fetch, 500);
            return () => {
                clearTimeout(handler);
            }
        }
    }, [artistFetched, context, item]);

    const onload = (ev:any) => {
        if(ev.target.height > ev.target.width && ev.target.height > ref.current!.clientWidth - 10){
            setStyle({width:"auto", height: `${ref.current!.clientWidth - 10}px`})
        }
    }
    

    return (
        <div ref={ref} style={{width: forceWidth ? "170px" : ""}} className="list-group-item d-flex flex-column align-items-center justify-content-between artist-item"
            onClick={() => navigate(`/artist`, { state: { id: item.id } })}>
            <div className="d-flex align-items-center justify-content-center artist-image-container">
                {coverArt !== "" ? <img style={style} src={coverArt} onLoad={onload} className="artist-image"></img> : <Loading />}
            </div>
            <div className="w-100 d-flex flex-column align-items-start justify-content-end text-white no-overflow">
                <span>
                    {item.name}
                </span>
                <span>
                    {item.albumCount} {item.albumCount > 1 ? "albums" : "album"}
                </span>
            </div>
        </div>
    )
}
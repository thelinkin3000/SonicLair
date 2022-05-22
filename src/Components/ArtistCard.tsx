import { IArtist } from "../Models/API/Responses/IArtist";
import "./ArtistCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import GetArtistInfo from "../Api/GetArtistInfo";
import { AppContext } from "../AppContext";
import useVisible from "../Hooks/useVisible";
import Loading from "./Loading";
export default function ArtistCard({ item }: { item: IArtist}) {
    const navigate = useNavigate();
    const [artistInfo, setArtistInfo] = useState<IArtistInfoResponse>();
    const [artistFetched, setArtistFetched] = useState<boolean>(false);
    const { context } = useContext(AppContext);
    const ref = useRef<HTMLDivElement>(null);
    const visible = useVisible(ref, '0px');
    const [coverArt, setCoverArt] = useState<string>("");

    useEffect(() => {
        console.log("visible?", visible);
        const fetch = async () => {
            const ret = await GetArtistInfo(context, item.id);

            setArtistInfo(ret);
        }
        if (visible && !artistFetched && context.url !== "") {
            fetch();
        }
    }, [visible, artistFetched, context]);
    return (
        <div ref={ref} className="list-group-item d-flex flex-column align-items-center justify-content-between artist-item"
            onClick={() => navigate(`/artist`, { state: { id: item.id } })}>
            <div className="d-flex align-items-center justify-content-center artist-image-container">
                {artistInfo ? <img src={artistInfo?.artistInfo2?.mediumImageUrl} className="artist-image"></img> : <Loading />}
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
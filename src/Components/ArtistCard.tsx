import { IArtist } from "../Models/API/Responses/IArtist";
import "./ArtistCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import GetArtistInfo from "../Api/GetArtistInfo";
import { AppContext } from "../AppContext";
export default function ArtistCard({ item }: { item: IArtist }) {
    const navigate = useNavigate();
    const [artistInfo, setArtistInfo] = useState<IArtistInfoResponse>();
    const [artistFetched, setArtistFetched] = useState<boolean>(false);
    const {context} = useContext(AppContext);
    useEffect(() => {
        const fetch = async () => {
            const ret = await GetArtistInfo(context, item.id);

            setArtistInfo(ret);
        }
        if (!artistFetched && context.url !== "") {
            fetch();
        }
    }, [artistFetched, context]);
    return (
        <div className="list-group-item d-flex flex-column align-items-center justify-content-between artist-item"
            onClick={() => navigate(`/artist`, { state: { id: item.id } })}>
            <div className="d-flex align-items-center justify-content-center h-100">
                <img src={artistInfo?.artistInfo?.mediumImageUrl} className="artist-image"></img>
            </div>
            <div className="d-flex flex-column align-items-end justify-content-end text-white no-overflow">{item.name}</div>
        </div>
    )
}
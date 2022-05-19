import { IArtist } from "../Models/API/Responses/IArtist";
import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { IAlbumArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { GetAsParams } from "../Helpers";
import GetBasicParams from "../Api/GetBasicParams";
import { useContext } from "react";
import { AppContext } from "../AppContext";
export default function AlbumCard({ item }: { item: IAlbumArtistResponse}) {
    const navigate = useNavigate();
    const {context} = useContext(AppContext);
    const getCoverArtParams = () => {
        return GetAsParams({ ...GetBasicParams(context), id: item.id });
    };
    return (
        <div className="list-group-item d-flex flex-column align-items-center justify-content-between album-item"
            onClick={() => navigate(`/album`, { state: { id: item.id } })}>
            <div className="d-flex align-items-center justify-content-center h-100">
                <img src={`${context.url}/rest/getCoverArt?${getCoverArtParams()}`} className="album-image"></img>

            </div>
            <div className="text-center text-white">{item.name}</div>
        </div>
    )
}
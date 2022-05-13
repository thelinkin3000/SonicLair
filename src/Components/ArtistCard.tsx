import { IArtist } from "../Models/API/Responses/IArtist";
import "./ArtistCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
export default function ArtistCard({ item }: { item: IArtist }) {
    const navigate = useNavigate();

    return (
        <div className="list-group-item d-flex flex-column align-items-center justify-content-between artist-item"
            onClick={() => navigate(`/artist`, { state: { id: item.id } })}>
            <div className="d-flex align-items-center justify-content-center h-100">
                <img src={item.artistImageUrl} className="artist-image"></img>

            </div>
            <div className="text-center text-primary">{item.name}</div>
        </div>
    )
}
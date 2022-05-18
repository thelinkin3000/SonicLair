import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { GetAsParams, SecondsToHHSS } from "../Helpers";
// With the Tauri API npm package:
import { useContext } from "react";
import { CurrentTrackContext } from "../AudioContext";
import classNames from "classnames";
import "./SongItem.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";


export default function SongItem({ item, album }: { item: IAlbumSongResponse, album: IAlbumSongResponse[] }) {
    const { currentTrack, setPlaylistAndPlay } = useContext(CurrentTrackContext);
    const play = () => {
        setPlaylistAndPlay(album, album.indexOf(item));
    }
    return (
        <div className={classNames("list-group-item", currentTrack.id === item.id && "highlight")} onClick={() => play()}>
            <div className="row">
                <div className="col-auto">{item.track}</div>
                <div className="col">{currentTrack.id === item.id && <FontAwesomeIcon icon={faVolumeHigh}/>}  {item.title}</div>
                <div className="col-auto">{SecondsToHHSS(item.duration)}</div>
            </div>
        </div>
    )
}
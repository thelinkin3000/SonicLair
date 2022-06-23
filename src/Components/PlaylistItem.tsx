import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SecondsToHHSS } from "../Helpers";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";
import VLC from "../Plugins/VLC";
import "./PlaylistEntry.scss";

export function PlaylistItem({ item }: { item: IPlaylist }): JSX.Element {
    const navigate = useNavigate();
    const [coverArt, setCoverArt] = useState<string>("");
    useEffect(() => {
        const func = async () => {
            const ret = await VLC.getAlbumArt({ id: item.coverArt });
            if (ret.status === "ok") {
                setCoverArt(ret.value ?? "");
            }
        };
        func();
    }, [coverArt, item.coverArt]);
    const nav = useCallback(
        (id: string) => {
            navigate(`/playlist`, { state: { id: item.id } });
        },
        [item.id, navigate]
    );
    return (
        <div
            className="list-group-item playlist-item not-selectable w-100"
            onClick={() => nav(item.id)}
        >
            <div className="row">
                <div className="col-auto">
                    <img alt="" src={coverArt}></img>
                </div>
                <div className="col d-flex flex-column align-items-start justify-content-around">
                    <span className="w-100 text-start">{item.name}</span>
                    <span className="subtitle fst-italic w-100 text-start">{item.comment}</span>
                    {item.songCount > 0 && (
                        <span className="subtitle">
                            {item.songCount} songs totalling{" "}
                            {SecondsToHHSS(item.duration)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

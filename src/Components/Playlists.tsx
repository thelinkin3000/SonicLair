import { Toast } from "@capacitor/toast";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useState } from "react";
import { MenuContext } from "../AppContext";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";
import VLC from "../Plugins/VLC";
import { PlaylistItem } from "./PlaylistItem";

export default function Playlists() {
    const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
    const { setMenuContext } = useContext(MenuContext);

    const fetch = useCallback(async () => {
        const ret = await VLC.getPlaylists();
        const current = await VLC.getCurrentPlaylist();
        if (current.status === "ok" && ret.status === "ok") {
            setPlaylists([current.value!!, ...ret.value!!]);
        }
    },[]);
    useEffect(() => {
        
        fetch();
    }, [fetch, playlists]);

    const areYouSure = useCallback(
        (item: IPlaylist) => {
            const yesImSure = async () => {
                const ret = await VLC.removePlaylist({ id: item.id });
                if (ret.status === "ok") {
                    Toast.show({ text: "Playlist removed successfully!" });
                    fetch();
                } else {
                    Toast.show({ text: ret.error });
                }
            };
            setTimeout(() => {
                setMenuContext({
                    show: true,
                    x: "20vw",
                    y: "10vh",
                    body: (
                        <div
                            className="d-flex flex-column align-items-center justify-content-between"
                            style={{ width: "60vw", height: "20vh" }}
                        >
                            <span className="w-100 text-center text-white">
                                {`Are you sure you want to delete the playlist "${item.name}"?`}
                            </span>
                            <button className="btn btn-danger" onClick={yesImSure}>Delete</button>
                        </div>
                    ),
                });
            }, 100);
        },
        [fetch, setMenuContext]
    );
    return (
        <div className="d-flex flex-column w-100 h-100 align-items-start">
            {playlists.length > 0 && playlists[0].name !== "" && (
                <>
                    <div className="section-header text-white">
                        Currently playing
                    </div>
                    <hr className="text-white w-100 mt-0" />
                    <div className="list-group w-100">
                        <PlaylistItem item={playlists[0]} />
                    </div>
                </>
            )}
            {playlists.length > 1 && (
                <>
                    <div className="section-header text-white mt-3">
                        Playlists
                    </div>
                    <hr className="text-white w-100 mt-0" />
                    <div className="list-group w-100 h-100 scrollable overflow-scroll">
                        {playlists.slice(1, playlists.length).map((s) => (
                            <div className="d-flex flex-row align-items-center justify-content-between">
                                <PlaylistItem item={s} key={s.id} />
                                <div
                                    onClick={() => {
                                        areYouSure(s);
                                    }}
                                    className="d-flex flex-row align-items-center justify-content-center"
                                    style={{ width: "70px" }}
                                >
                                    <FontAwesomeIcon
                                        icon={faTrash}
                                        className="text-white"
                                        size="2x"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

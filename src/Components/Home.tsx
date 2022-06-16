import { useEffect, useState } from "react";
import {
    IAlbumArtistResponse,
    IAlbumSongResponse,
} from "../Models/API/Responses/IArtistResponse";
import AlbumCard from "./AlbumCard";
import RandomSongCard from "./RandomSongCard";
import VLC from "../Plugins/VLC";
import { Toast } from "@capacitor/toast";

export default function Home() {
    const [fetched, setFetched] = useState<boolean>(false);
    const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
    const [songs, setSongs] = useState<IAlbumSongResponse[]>([]);
    const [newAlbums, setNewAlbums] = useState<IAlbumArtistResponse[]>([]);
    const [recentAlbums, setRecentAlbums] = useState<IAlbumArtistResponse[]>(
        []
    );

    useEffect(() => {
        if (fetched) return;
        const fetch = async () => {
            const topAlbums = await VLC.getTopAlbums({
                type: null,
                size: null,
            });
            if (topAlbums.status === "ok") {
                setAlbums(topAlbums.value!);
            } else {
                await Toast.show({ text: topAlbums.error });
            }
            const randomSongs = await VLC.getRandomSongs();
            if (randomSongs.status === "ok") {
                setSongs(randomSongs.value!);
            }
            const newAlbums = await VLC.getTopAlbums({
                type: "newest",
                size: null,
            });
            if (newAlbums.status === "ok") {
                setNewAlbums(newAlbums.value!);
            }
            const recentAlbums = await VLC.getTopAlbums({
                type: "recent",
                size: null,
            });
            if (recentAlbums.status === "ok") {
                setRecentAlbums(recentAlbums.value!);
            }
            setFetched(true);
        };
        fetch();
    }, [fetched]);

    return (
        <div className="d-flex flex-column h-100 scrollable overflow-scroll scrollable-hidden">
            {albums && albums.length && albums.length > 0 && (
                <>
                    <div
                        className="col-12 text-start"
                        style={{ height: "min-content" }}
                    >
                        <span className="section-header text-white">
                            Top Albums
                        </span>
                        <hr className="text-white w-100" />
                    </div>
                    <div
                        className="col-12 overflow-scroll scrollable scrollable-hidden"
                        style={{ height: "min-content" }}
                    >
                        <div className="d-flex flex-row">
                            {albums.map((s) => (
                                <div style={{ margin: "10px" }}>
                                    <AlbumCard item={s} forceWidth={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            {songs && songs.length && songs.length > 0 && (
                <>
                    <div className="col-12 text-start">
                        <span className="section-header text-white">
                            Random Songs
                        </span>
                        <hr className="text-white w-100" />
                    </div>
                    <div
                        className="col-12 overflow-scroll scrollable scrollable-hidden"
                        style={{ height: "min-content" }}
                    >
                        <div className="d-flex flex-row">
                            {songs.map((s) => (
                                <div style={{ margin: "10px" }}>
                                    <RandomSongCard item={s} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            {recentAlbums && recentAlbums.length && recentAlbums.length > 0 && (
                <>
                    <div
                        className="col-12 text-start"
                        style={{ height: "min-content" }}
                    >
                        <span className="section-header text-white">
                            Recently Played
                        </span>
                        <hr className="text-white w-100" />
                    </div>
                    <div
                        className="col-12 overflow-scroll scrollable scrollable-hidden"
                        style={{ height: "min-content" }}
                    >
                        <div className="d-flex flex-row">
                            {recentAlbums.map((s) => (
                                <div style={{ margin: "10px" }}>
                                    <AlbumCard item={s} forceWidth={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
            {newAlbums && newAlbums.length && newAlbums.length > 0 && (
                <>
                    <div
                        className="col-12 text-start"
                        style={{ height: "min-content" }}
                    >
                        <span className="section-header text-white">
                            Recently Added
                        </span>
                        <hr className="text-white w-100" />
                    </div>
                    <div
                        className="col-12 overflow-scroll scrollable scrollable-hidden"
                        style={{ height: "min-content" }}
                    >
                        <div className="d-flex flex-row">
                            {newAlbums.map((s) => (
                                <div style={{ margin: "10px" }}>
                                    <AlbumCard item={s} forceWidth={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

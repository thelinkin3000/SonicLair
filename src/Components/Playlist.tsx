import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";
import VLC from "../Plugins/VLC";
import { PlaylistEntry } from "./PlaylistEntry";
import "./Playlist.scss";
import { onlyUnique } from "../Helpers";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { PluginListenerHandle } from "@capacitor/core";
import { CurrentTrackContextDefValue } from "../AudioContext";
import { Toast } from "@capacitor/toast";

export default function Playlist() {
    const { state }: any = useLocation();
    const [playlist, setPlaylist] = useState<IPlaylist>();
    const [currentTrack, setCurrentTrack] = useState<IAlbumSongResponse>(
        CurrentTrackContextDefValue
    );
    const vlcListener = useRef<PluginListenerHandle[]>();
    const navigate = useNavigate();
    const refreshPlaylist = useCallback(async () => {
        const ret =
            state.id === "current"
                ? await VLC.getCurrentPlaylist()
                : await VLC.getPlaylist({ id: state.id });
        if (ret.status === "ok") {
            setPlaylist(ret.value!!);
        }
    }, [state.id]);

    useEffect(() => {
        refreshPlaylist();
    }, [refreshPlaylist, state]);

    useEffect(() => {
        const f = async () => {
            if (vlcListener.current) {
                vlcListener.current.forEach(async (s) => {
                    await s.remove();
                });
            }
            vlcListener.current = [
                await VLC.addListener(`currentTrack`, (info: any) => {
                    setCurrentTrack(info.currentTrack);
                }),
                await VLC.addListener("playlistUpdated", async (info: any) => {
                    if (state.id === "current") {
                        var pl = await VLC.getCurrentPlaylist();
                        setPlaylist(pl.value!);
                    }
                    var ret = await VLC.getCurrentState();
                    setCurrentTrack(ret.value?.currentTrack!);
                }),
            ];
            const ret = await VLC.getCurrentState();
            if (ret.status === "ok") {
                setCurrentTrack(ret.value?.currentTrack!!);
            }
        };
        f();
    }, [state.id]);

    const getArtistNames = useCallback(() => {
        const artists = playlist?.entry.map((s) => s.artist).filter(onlyUnique);
        if (artists) {
            let a = artists
                .slice(0, artists.length > 3 ? 3 : artists.length)
                .join(", ");
            if (artists.length > 3) {
                a = `${a} and more`;
            }
            return a;
        } else return "";
    }, [playlist]);

    const saveAsPlaylist = useCallback(async () => {
        const ret = await VLC.createPlaylist({
            songId: playlist!.entry.map((s) => s.id),
            name: playlist!.name,
        });
        if (ret.status === "ok") {
            Toast.show({ text: "Playlist created successfully" });
            navigate("/playlist", { state: { id: ret.value!.id } });
        } else {
            Toast.show({ text: ret.error });
        }
    }, [navigate, playlist]);

    const editPlaylist = useCallback(async () => {
        navigate("/editPlaylist", { state: { id: playlist!.id } });
    }, [navigate, playlist]);

    return (
        <div className="playlist-container d-flex flex-column w-100 ">
            <div className="d-flex flex-row align-items-center justify-content-between w-100">
                <div className="section-header text-white w-100 text-start">
                    {playlist && playlist.id !== "current"
                        ? playlist.name
                        : "Currently playing"}
                </div>
                {playlist && playlist.id !== "current" && (
                    <button
                        className="btn btn-primary ms-2"
                        onClick={editPlaylist}
                    >
                        Edit
                    </button>
                )}
            </div>

            <div className="subtitle text-white w-100 text-start mb-3 fst-italic">
                {playlist && playlist.id !== "current"
                    ? playlist.comment
                    : playlist && `${playlist.name} ${playlist.comment}`}
            </div>

            <div className="subtitle text-white w-100 text-start">
                {playlist && `Featuring music by ${getArtistNames()}`}
            </div>

            {playlist && playlist.id === "current" && (
                <button
                    className="btn btn-primary my-3"
                    onClick={saveAsPlaylist}
                >
                    Save as playlist
                </button>
            )}

            <div className="list-group overflow-scroll scrollable scrollable-hidden w-100">
                {playlist?.entry.map((s) => (
                    <PlaylistEntry
                        key={s.id}
                        item={s}
                        playlist={playlist}
                        currentTrack={currentTrack}
                        refreshPlaylist={refreshPlaylist}
                        actionable={true}
                        style={undefined}
                        state={state}
                    />
                ))}
            </div>
        </div>
    );
}

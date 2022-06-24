import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { SecondsToHHSS } from "../Helpers";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import "./SongItem.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { MenuContext } from "../AppContext";
import VLC from "../Plugins/VLC";
import { Toast } from "@capacitor/toast";
import { PluginListenerHandle } from "@capacitor/core";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";

export default function SongItem({
    item,
    currentTrack,
}: {
    item: IAlbumSongResponse;
    currentTrack: IAlbumSongResponse;
}) {
    const listeners = useRef<{ event: string; listener: (ev: any) => void }[]>(
        []
    );
    const { setMenuContext } = useContext(MenuContext);
    const vlcListener = useRef<PluginListenerHandle>();
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [cached, setCached] = useState<boolean>(false);

    const playRadio = useCallback(async () => {
        const s = await VLC.playRadio({ song: item.id });
        if (s.status === "error") {
            await Toast.show({ text: s.error });
        }
    }, [item]);

    const play = useCallback(async () => {
        const s = await VLC.playAlbum({
            album: item.albumId,
            track: item.track - 1,
        });
        if (s.status === "error") {
            await Toast.show({ text: s.error });
        }
    }, [item]);

    useEffect(() => {
        const f = async () => {
            if (vlcListener.current) {
                await vlcListener.current.remove();
            }
            vlcListener.current = await VLC.addListener(
                `progress${item.id}`,
                (info: any) => {
                    setDownloadProgress(info.progress);
                    if (info.progress >= 99) {
                        setCached(true);
                    }
                }
            );
            const status = await VLC.getSongStatus({ id: item.id });
            if (status.status === "ok") {
                setCached(status.value!!);
            }
        };
        f();
    }, [item]);

    const addToPlaylists = useCallback(
        async (x: number, y: number) => {
            const playlists = await VLC.getPlaylists();
            const add = async (s: IPlaylist | null) => {
                const ret = await VLC.addToPlaylist({
                    id: s?.id ?? null,
                    songId: item.id,
                });
                if (ret.status === "ok") {
                    Toast.show({
                        text: "Song added successfully",
                    });
                } else {
                    Toast.show({ text: ret.error });
                }
            };
            if (playlists.status === "ok") {
                setMenuContext({
                    x: "10vw",
                    y: "10vh",
                    show: true,
                    body: (
                        <div
                            className="d-flex flex-column px-2"
                            style={{ width: "80vw", height: "80vh" }}
                        >
                            <div className="text-white w-100 section-header mb-3">
                                Available playlists
                            </div>
                            <div className="d-flex flex-column w-100 h-100 scrollable overflow-scroll">
                            <button
                                        className="btn btn-primary mb-2"
                                        onClick={() => {
                                            add(null);
                                        }}
                                    >
                                        Create playlist and add
                                    </button>
                                {playlists.value?.map((s) => (
                                    <button
                                        className="btn btn-primary mb-1"
                                        onClick={() => {
                                            add(s);
                                        }}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ),
                });
            }
        },
        [item.id, setMenuContext]
    );

    const ref = (r: HTMLDivElement) => {
        if (r) {
            listeners.current.forEach((element) => {
                r.removeEventListener(element.event, element.listener);
            });
            listeners.current.splice(0, listeners.current.length);
            const func = (ev: any) => {
                setMenuContext({
                    x: ev.pageX,
                    y: ev.pageY,
                    show: true,
                    body: (
                        <div className="d-flex flex-column">
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    playRadio();
                                }}
                            >
                                Start radio
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    addToPlaylists(ev.pageX, ev.pageY);
                                }}
                            >
                                Add to Playlist
                            </button>
                        </div>
                    ),
                });
            };
            r.addEventListener("contextmenu", func);
            listeners.current.push({ event: "contextmenu", listener: func });
        }
    };
    return (
        <div
            ref={ref}
            className={classNames(
                "list-group-item",
                currentTrack.id === item.id && "highlight",
                "not-selectable"
            )}
            onClick={() => play()}
        >
            <div className="row">
                <div className="col-auto">{item.track}</div>
                <div className="col">
                    {currentTrack.id === item.id && (
                        <FontAwesomeIcon icon={faVolumeHigh} />
                    )}{" "}
                    {item.title}
                </div>
                <div className="col-auto text-end">
                    {SecondsToHHSS(item.duration)}{" "}
                    {cached && (
                        <FontAwesomeIcon icon={faArrowDown}></FontAwesomeIcon>
                    )}
                </div>
                {downloadProgress > 0 && downloadProgress < 100 && (
                    <div
                        className="progress"
                        style={{ height: "2px", margin: 0, padding: 0 }}
                    >
                        <div
                            className="progress-bar progress-bar-soniclair"
                            role="progressbar"
                            style={{
                                width: `${downloadProgress}%`,
                                margin: 0,
                                padding: 0,
                            }}
                        ></div>
                    </div>
                )}
            </div>
        </div>
    );
}

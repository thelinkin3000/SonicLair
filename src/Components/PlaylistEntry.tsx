import { Toast } from "@capacitor/toast";
import classNames from "classnames";
import {
    CSSProperties,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { MenuContext } from "../AppContext";
import { SecondsToHHSS } from "../Helpers";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";

import VLC from "../Plugins/VLC";
import "./PlaylistEntry.scss";

export function PlaylistEntry({
    item,
    playlist,
    currentTrack,
    refreshPlaylist,
    actionable,
    style,
}: {
    item: IAlbumSongResponse;
    playlist: IPlaylist;
    currentTrack: IAlbumSongResponse;
    refreshPlaylist: () => void;
    actionable: boolean;
    style: CSSProperties | undefined;
}) {
    const listeners = useRef<{ event: string; listener: (ev: any) => void }[]>(
        []
    );
    const { setMenuContext } = useContext(MenuContext);

    const [coverArt, setCoverArt] = useState<string>("");
    useEffect(() => {
        const func = async () => {
            const ret = await VLC.getAlbumArt({ id: item.albumId });
            if (ret.status === "ok") {
                setCoverArt(ret.value!);
            }
        };
        func();
    }, [coverArt, item.albumId]);

    const selfRef = useRef<HTMLDivElement>();

    const ref = (r: HTMLDivElement) => {
        if (r) {
            selfRef.current = r;
            if (actionable) {
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
                            <button
                                className="btn btn-primary"
                                onClick={async () => {
                                    const ret = await VLC.removeFromPlaylist({
                                        id: playlist.id,
                                        track: playlist.entry.indexOf(item),
                                    });
                                    if (ret.status === "ok") {
                                        refreshPlaylist();
                                    } else {
                                        Toast.show({ text: ret.error });
                                    }
                                }}
                            >
                                Remove from playlist
                            </button>
                        ),
                    });
                };
                r.addEventListener("contextmenu", func);
                listeners.current.push({
                    event: "contextmenu",
                    listener: func,
                });
            }
        }
    };

    const playPlaylist = useCallback(async () => {
        if (actionable) {
            await VLC.playPlaylist({
                playlist: playlist.id,
                track: playlist.entry.indexOf(item),
            });
        }
    }, [actionable, item, playlist.entry, playlist.id]);

    const skipTo = useCallback(async () => {
        if (actionable) {
            await VLC.skipTo({
                track: playlist.entry.indexOf(item),
            });
        }
    }, [actionable, item, playlist.entry]);

    useEffect(() => {
        if (currentTrack.id === item.id && selfRef.current && actionable) {
            selfRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [actionable, currentTrack, item.id]);

    return (
        <div
            style={style}
            ref={ref}
            className={classNames(
                "list-group-item",
                "playlist-item",
                "not-selectable",
                currentTrack.id === item.id ? "highlight" : ""
            )}
            onClick={async () => {
                playlist.id === "current" ? skipTo() : playPlaylist();
            }}
        >
            <div className="row">
                <div className="col-auto">
                    <img alt="" src={coverArt}></img>
                </div>
                <div className="col d-flex flex-column align-items-start justify-content-around">
                    <span className="d-flex flex-row align-items-center justify-content-start w-100 text-start">
                        {item.title}
                    </span>
                    <span className="subtitle d-flex flex-row align-items-start justify-content-start w-100 text-start">
                        by {item.artist}, from {item.album}
                    </span>
                </div>
                {actionable && <div className="col-auto d-flex flex-row align-items-center justify-content-end">
                    {SecondsToHHSS(item.duration)}
                </div>}
                
            </div>
        </div>
    );
}

import { faForwardStep, faPause, faPlay, faVolumeHigh, faVolumeLow } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import GetBasicParams from "../Api/GetBasicParams";
import { AppContext } from "../AppContext";
import { CurrentTrackContext, CurrentTrackContextDefValue } from "../AudioContext"
import { GetAsParams, SecondsToHHSS } from "../Helpers";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import "./AudioControl.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _, { forEach, identity, indexOf } from 'lodash';
import { useNavigate } from "react-router-dom";
import classnames from "classnames";
import axios from "axios";
import { Toast } from "@capacitor/toast";
import VLC from "../Plugins/VLC";
import MediaSession from "../Plugins/MediaSession";

interface IListener {
    event: string;
    func: (ev: any) => void;
}


export default function AudioControl({ }) {
    const { currentTrack, setCurrentTrack, playlist, setPlaylistAndPlay, setPlaylist } = useContext(CurrentTrackContext);
    const { context } = useContext(AppContext);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playTime, setPlayTime] = useState<number>(0);
    const [coverArt, setCoverArt] = useState<string>("");
    const [audioInstance, setAudioInstance] = useState<HTMLAudioElement>(new Audio());
    const listeners = useRef<IListener[]>([]);
    const navigate = useNavigate();
    const [volume, setVolume] = useState<number>(1);
    const vlcListeners = useRef<any[]>([]);
    const mediaListeners = useRef<any[]>([]);
    const play = (track: IAlbumSongResponse) => {
        try {
            VLC.play({ uri: `${context.activeAccount.url}/rest/stream?${getSongParams(track)}` });
            MediaSession.play();
        }
        catch (e: any) {
            if (typeof (e) === typeof (DOMException)) {
                Toast.show({
                    text: "Your browser or webview doesn't support this song's format. Please try to play another song."
                });
            }
            else {
                Toast.show({
                    text: "There was an error trying to play this track. Please try to play another song."
                });
            }

        }

    }

    const changeVolume = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        await VLC.setVolume({ volume: Math.floor(vol * 100) });
    }, [audioInstance]);

    const changePlayTime = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const time = parseFloat(e.target.value);
        VLC.seek({ time: time });
    }, [audioInstance, currentTrack]);

    const getCoverArtParams = useCallback((currentTrack: IAlbumSongResponse) => {
        return GetAsParams({ ...GetBasicParams(context), id: currentTrack.coverArt });
    }, [context]);

    const getSongParams = useCallback((currentTrack: IAlbumSongResponse) => {
        return GetAsParams({ ...GetBasicParams(context), id: currentTrack.id });
    }, [context]);

    const scrobble = useCallback(async () => {
        const ret = await axios.get(`${context.activeAccount.url}/rest/scrobble?${getSongParams(currentTrack)}`);
    }, [context, currentTrack]);


    useEffect(() => {
        if (currentTrack.id === "") {
            return;
        }
        setCoverArt(`${context.activeAccount.url}/rest/getCoverArt?${getCoverArtParams(currentTrack)}`);
        if (context.activeAccount.type === "navidrome") {
            scrobble();
        }
        play(currentTrack);
        if (coverArt !== "") {
            MediaSession.updateMedia({
                album: currentTrack.album,
                artist: currentTrack.artist,
                song: currentTrack.title,
                albumImage: coverArt
            });
        }
    }, [currentTrack, coverArt]);

    const playNext = useCallback(() => {
        if (playlist.length < 2 || playlist.indexOf(currentTrack) === (playlist.length - 1))
            return;
        setCurrentTrack(playlist[playlist.indexOf(currentTrack) + 1]);

    }, [currentTrack, playlist]);

    const playPrev = useCallback(() => {
        if (playlist.length < 2 || playlist.indexOf(currentTrack) === 0)
            return;
        setCurrentTrack(playlist[playlist.indexOf(currentTrack) - 1]);

    }, [currentTrack, playlist]);

    const togglePlaying = () => {
        if (isPlaying) {
            VLC.pause();
        }
        else {
            VLC.play({ uri: null });
        }
    };

    useEffect(() => {
        vlcListeners.current.forEach(s => (VLC as any).removeListener(s));
        // I'm sorry typescript gods.
        vlcListeners.current = [
            (VLC as any).addListener('play', (info: any) => {
                setIsPlaying(true);
            }),
            (VLC as any).addListener('paused', (info: any) => {
                setIsPlaying(false);
            }),
            (VLC as any).addListener('stopped', (info: any) => {
                setIsPlaying(false);
                if (playlist.indexOf(currentTrack) !== (playlist.length - 1)) {
                    setCurrentTrack(playlist[playlist.indexOf(currentTrack) + 1]);
                }
            }),
            (VLC as any).addListener('progress', (info: any) => {
                setPlayTime(info.time);
            })];
            mediaListeners.current.forEach(s => (MediaSession as any).removeListener(s));
            // I'm sorry typescript gods.
            mediaListeners.current = [
                (MediaSession as any).addListener('pause', (info: any) => {
                    if (isPlaying) {
                        VLC.pause();
                    }
                    else {
                        VLC.play({ uri: null });
                    }
                })];

        return () => {
            // setCurrentTrack(CurrentTrackContextDefValue);
            // setPlaylist([]);
        }
    }, [playlist, currentTrack, isPlaying, setIsPlaying, setCurrentTrack]);

    const goToAlbum = useCallback(() => {
        navigate(`/album`, { state: { id: currentTrack.parent } });
    }, [currentTrack]);

    return (
        <div className={classnames("flex-column justify-content-between w-100", "mt-3", currentTrack.id === "" ? "d-none" : "d-flex")}>
            <div className="d-flex flex-row align-items-center justify-content-between w-100">
                {/* <div className="flex-shrink-1 hide-overflow" > */}
                <div onClick={goToAlbum} className={`current-track-header flex-row align-items-center justify-content-start ${currentTrack.id === "" ? "d-none" : "d-flex"}`}>
                    <img className={"current-track-img"} src={coverArt}></img>
                    <div className="ml-2 flex-shrink-5  h-100 d-flex flex-column align-items-start justify-content-end text-start fade-right" >
                        <span className="text-white no-wrap" style={{ overflow: "hidden", whiteSpace: "nowrap", fontWeight: 800 }}>{currentTrack.title}</span>
                        <span className="text-white no-wrap mb-0" style={{ overflow: "hidden", whiteSpace: "nowrap" }}>by {currentTrack.artist}</span>
                    </div>
                </div>
                {/* </div> */}
                <div className="d-flex  flex-grow-1 flex-column align-items-end justify-content-end">
                    <div className="d-flex flex-row align-items-center justify-content-center p-0">
                        <button type="button" className="btn btn-link text-white" onClick={playPrev}>
                            <FontAwesomeIcon flip="horizontal" icon={faForwardStep}></FontAwesomeIcon>
                        </button>
                        <button type="button" className="btn btn-link text-white" onClick={togglePlaying}>
                            {isPlaying ?
                                <FontAwesomeIcon icon={faPause}></FontAwesomeIcon> :
                                <FontAwesomeIcon icon={faPlay}></FontAwesomeIcon>
                            }
                        </button>
                        <button type="button" className="btn btn-link text-white" onClick={playNext}>
                            <FontAwesomeIcon icon={faForwardStep}></FontAwesomeIcon>
                        </button>
                    </div>
                    <div className="hide-mobile-flex flex-row align-items-center justify-content-center">
                        <FontAwesomeIcon icon={faVolumeLow} className="text-white" />
                        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => changeVolume(e)} className="mx-2"></input>
                        <FontAwesomeIcon icon={faVolumeHigh} className="text-white" />
                    </div>
                </div>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between text-white">
                <span>{SecondsToHHSS((playTime ?? 0) * (currentTrack?.duration ?? 0))}</span>
                <span>{SecondsToHHSS(currentTrack.duration)}</span>
            </div>
            <div className="w-100">
                <input type="range" className="w-100" min={0} max={1} step={0.01} value={playTime} onChange={(e) => changePlayTime(e)}></input>
            </div>
        </div>
    )
}


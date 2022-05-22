import { faForwardStep, faPause, faPlay, faVolumeHigh, faVolumeLow } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import GetBasicParams from "../Api/GetBasicParams";
import { AppContext } from "../AppContext";
import { CurrentTrackContext } from "../AudioContext"
import { GetAsParams, SecondsToHHSS } from "../Helpers";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import "./AudioControl.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _, { forEach, identity, indexOf } from 'lodash';
import { useNavigate } from "react-router-dom";
import classnames from "classnames";

interface IListener {
    event: string;
    func: (ev: any) => void;
}


export default function AudioControl({ }) {
    const { currentTrack, setCurrentTrack, playlist, setPlaylistAndPlay } = useContext(CurrentTrackContext);
    const { context } = useContext(AppContext);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playTime, setPlayTime] = useState<number>(0);
    const [coverArt, setCoverArt] = useState<string>("");
    const [audioInstance, setAudioInstance] = useState<HTMLAudioElement>(new Audio());
    const listeners = useRef<IListener[]>([]);
    const navigate = useNavigate();
    const [volume, setVolume] = useState<number>(1);

    const changeVolume = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        if (!audioInstance)
            return;
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        audioInstance!.volume = vol;
    }, [audioInstance]);

    const changePlayTime = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        if (!audioInstance)
            return;
        const time = parseFloat(e.target.value);
        setPlayTime(currentTrack.duration * time);
        audioInstance!.currentTime = currentTrack.duration * time;
    }, [audioInstance, currentTrack]);

    const getCoverArtParams = useCallback((currentTrack: IAlbumSongResponse) => {
        return GetAsParams({ ...GetBasicParams(context), id: currentTrack.coverArt });
    }, [context]);

    const getSongParams = useCallback((currentTrack: IAlbumSongResponse) => {
        return GetAsParams({ ...GetBasicParams(context), id: currentTrack.id });
    }, [context]);

    useEffect(() => {
        if (!audioInstance)
            return;
        audioInstance.addEventListener("play", () => { setIsPlaying(true) });
        audioInstance.addEventListener("pause", () => { setIsPlaying(false) });

    }, [audioInstance]);

    useEffect(() => {
        if (!audioInstance)
            return;
        forEach(listeners.current.filter(s => s.event === 'ended'), (listener: IListener) => {
            audioInstance.removeEventListener(listener.event, listener.func);
        });
        // Delete all event listeners from the audioinstance and the listeners array
        forEach(listeners.current.filter(s => s.event === 'ended'), (listener: IListener) => {
            audioInstance.removeEventListener(listener.event, listener.func);
            listeners.current.splice(listeners.current.indexOf(listener), 1);
        });
        const endedFunc = (ev: any) => {
            if (playlist.indexOf(currentTrack) !== (playlist.length - 1)) {
                // This is not the last, we play the next track
                setCurrentTrack(playlist[playlist.indexOf(currentTrack) + 1]);
            }
        }
        audioInstance.addEventListener("ended", endedFunc);
        listeners.current.push({ event: "ended", func: endedFunc });
        audioInstance!.play();
    }, [playlist, currentTrack]);

    useEffect(() => {
        if (!audioInstance)
            return;
        setCoverArt(`${context.url}/rest/getCoverArt?${getCoverArtParams(currentTrack)}`);
        audioInstance!.pause();
        audioInstance!.src = `${context.url}/rest/stream?${getSongParams(currentTrack)}`;
        // Delete all event listeners from the audioinstance and the listeners array
        forEach(listeners.current.filter(s => s.event === 'timeupdate'), (listener: IListener) => {
            audioInstance.removeEventListener(listener.event, listener.func);
            listeners.current.splice(listeners.current.indexOf(listener), 1);
        });
        const progressFunc = (ev: any) => {
            setPlayTime(parseFloat(ev.path[0].currentTime) / currentTrack.duration);
        }
        audioInstance.addEventListener("timeupdate", progressFunc);
        listeners.current.push({ event: "timeupdate", func: progressFunc });
        audioInstance!.play();
    }, [currentTrack]);

    const playNext = useCallback(() => {
        if(playlist.length < 2 || playlist.indexOf(currentTrack) === (playlist.length - 1))
        return;
        setCurrentTrack(playlist[playlist.indexOf(currentTrack) + 1]);

    },[currentTrack, playlist]);

    const playPrev = useCallback(() => {
        if(playlist.length < 2 || playlist.indexOf(currentTrack) === 0)
        return;
        setCurrentTrack(playlist[playlist.indexOf(currentTrack) - 1]);

    },[currentTrack, playlist]);

    const togglePlaying = useCallback(() => {
        if (!audioInstance)
            return;
        if (audioInstance!.paused) {
            audioInstance!.play();
        }
        else {
            audioInstance!.pause();

        }
    }, [audioInstance]);

    useEffect(() => {
        if (audioInstance) {
            console.log(audioInstance);
        }
    }, [audioInstance]);
    const goToAlbum = useCallback(() => {
        navigate(`/album`,{ state: { id: currentTrack.parent} });
    },[currentTrack]);
    
    return (
        <div className={classnames("row","mt-3", currentTrack.id === 0 ? "d-none" : "")}>
            <div className="col-8" onClick={goToAlbum}>
                <div className={`current-track-header flex-row align-items-center justify-content-start ${currentTrack.id === 0 ? "d-none" : "d-flex"}`}>
                    <img className={"current-track-img"} src={coverArt}></img>
                    <div className="ml-2 h-100 d-flex flex-column align-items-start justify-content-end text-start fade-right w-100">
                        <span className="text-white no-wrap" style={{maxHeight:"50%", overflow:"hidden", textOverflow:"ellipsis", fontWeight:800}}>{currentTrack.title}</span>
                        <span className="text-white no-wrap mb-0" style={{maxHeight:"50%", overflow:"hidden", textOverflow:"ellipsis"}}>by {currentTrack.artist}</span>
                    </div>
                </div>
            </div>
            <div className="col-4 d-flex flex-column align-items-end justify-content-end">
                <div className="d-flex flex-column align-items-center justify-content-end">
                    <div>
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
                    <div className="hide-mobile">
                        <FontAwesomeIcon icon={faVolumeLow} className="text-white" />
                        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => changeVolume(e)} className="mx-2"></input>
                        <FontAwesomeIcon icon={faVolumeHigh} className="text-white" />
                    </div>

                </div>
            </div>
            <div className="col-12 d-flex flex-row justify-content-between text-white">
                <span>{SecondsToHHSS((playTime ?? 0) * (currentTrack?.duration ?? 0))}</span>
                <span>{SecondsToHHSS(currentTrack.duration)}</span>
            </div>
            <div className="col-12">
                <input type="range" className="w-100" min={0} max={1} step={0.01} value={playTime} onChange={(e) => changePlayTime(e)}></input>
            </div>
            <div className="col-12">

            </div>
        </div>
    )
}


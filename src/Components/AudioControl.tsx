import { faPause, faPlay, faVolumeHigh, faVolumeLow } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import GetBasicParams from "../Api/GetBasicParams";
import { AppContext } from "../AppContext";
import { CurrentTrackContext } from "../AudioContext"
import { GetAsParams, SecondsToHHSS } from "../Helpers";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
import "./AudioControl.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _, { identity } from 'lodash';


export default function AudioControl({ }) {
    const { currentTrack, setCurrentTrack, playlist, setPlaylistAndPlay } = useContext(CurrentTrackContext);
    const { context } = useContext(AppContext);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playTime, setPlayTime] = useState<number>(0);
    const [coverArt, setCoverArt] = useState<string>("");

    const update = useCallback((e: any, duration: number) => {
        console.log("update called");
        console.log(duration);
        setPlayTime(e.path[0].currentTime / duration);
    }, [setPlayTime]);

    const throttledFunction = useMemo(() => _.throttle(update, 1000), [update]);
    const audio = useRef(new Audio());
    const [volume, setVolume] = useState<number>(audio.current.volume ?? 1);
    useEffect(() => {
        console.log("something changed");
        if(throttledFunction){
            audio.current.addEventListener("timeupdate", (e: any) => {
                throttledFunction(e, currentTrack.duration);
            });
            audio.current.addEventListener("playing", (e: any) => {
                console.log("playing");
                setIsPlaying(true);
            });
            audio.current.addEventListener("play", (e: any) => {
                console.log("play");
                setIsPlaying(true);
            });
            audio.current.addEventListener("pause", (e: any) => {
                console.log("pause");
                setIsPlaying(false);
            });
            audio.current.addEventListener("ended", (e: any) => {
                if (playlist && playlist.length > 1 && playlist.indexOf(currentTrack) !== (playlist.length - 1)) {
                    setCurrentTrack(playlist[playlist.indexOf(currentTrack) + 1]);
                }
            });
        }
        
    }, [audio.current, throttledFunction]);
    


    const changeVolume = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        audio.current.volume = vol;
    }, []);

    const changePlayTime = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const time = parseFloat(e.target.value);
        setPlayTime(currentTrack.duration * time);
        audio.current.currentTime = currentTrack.duration * time;
    }, []);

    const getCoverArtParams = (currentTrack: IAlbumSongResponse) => {
        return GetAsParams({ ...GetBasicParams(context), id: currentTrack.coverArt });
    };
    const getSongParams = () => {
        return GetAsParams({ ...GetBasicParams(context), id: currentTrack.id });
    };

    useEffect(() => {
        setCoverArt(`${context.url}/rest/getCoverArt?${getCoverArtParams(currentTrack)}`);
        audio.current.pause();
        audio.current.src = `${context.url}/rest/stream?${getSongParams()}`;
        audio.current.play();
    }, [currentTrack]);

    const togglePlaying = useCallback(() => {
        if (audio.current.paused) {
            audio.current.play();
        }
        else {
            audio.current.pause();
        }
    }, []);

    return (
        <div className="row">
            <div className="col-6">
                <div className="current-track-header d-flex flex-row align-items-center justify-content-start">
                    <img className={"current-track-img"} src={coverArt}></img>
                    <div className="ml-2 h-100 d-flex flex-column align-items-start justify-content-end">
                        <span style={{ color: "white" }}>{currentTrack.title}</span>
                        <span style={{ color: "white" }}>by {currentTrack.artist}</span>
                    </div>
                </div>
            </div>
            <div className="col-6 d-flex flex-row align-items-center justify-content-end">
                <button type="button" className="btn btn-link" onClick={togglePlaying}>
                    {isPlaying ?
                        <FontAwesomeIcon icon={faPause}></FontAwesomeIcon> :
                        <FontAwesomeIcon icon={faPlay}></FontAwesomeIcon>
                    }
                </button>
                <FontAwesomeIcon icon={faVolumeLow} className="text-primary" />
                <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => changeVolume(e)} className="mx-2"></input>
                <FontAwesomeIcon icon={faVolumeHigh} className="text-primary" />
            </div>
            <div className="col-12 d-flex flex-row justify-content-between text-primary">
                <span>00:00</span>
                <span>{SecondsToHHSS(currentTrack.duration)}</span>
            </div>
            <div className="col-12">
                <input type="range" className="w-100" min={0} max={1} step={0.01} value={playTime} onChange={(e) => changePlayTime(e)}></input>
            </div>
        </div>
    )
}


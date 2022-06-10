import { faForwardStep, faPause, faPlay, faVolumeHigh, faVolumeLow } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../AppContext";
import { CurrentTrackContext, CurrentTrackContextDefValue } from "../AudioContext"
import { SecondsToHHSS } from "../Helpers";
import "./AudioControl.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _, { } from 'lodash';
import { useLocation, useNavigate } from "react-router-dom";
import classnames from "classnames";
import VLC from "../Plugins/VLC";
import { Backend } from "../Plugins/Audio";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import AndroidTVPlugin from "../Plugins/AndroidTV";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";

interface IListener {
    event: string;
    func: (ev: any) => void;
}

export default function AudioControl({ }) {
    const [currentTrack, setCurrentTrack] = useState<IAlbumSongResponse>(CurrentTrackContextDefValue);
    const [playing, setPlaying] = useState<boolean>(false);
    const [playtime, setPlaytime] = useState<number>(0);
    const [coverArt, setCoverArt] = useState<string>("");
    const audioInstance = useRef<Backend>(new Backend());
    const [androidTV, setAndroidTV] = useState<boolean>(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [volume, setVolume] = useState<number>(1);
    const listeners = useRef<PluginListenerHandle[]>([]);

    const changeVolume = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        await VLC.setVolume({ volume: vol });
    }, [audioInstance]);

    const changePlayTime = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const time = parseFloat(e.target.value);
        VLC.seek({ time: time });
    }, [audioInstance, currentTrack]);
    useEffect(() => {
        const fetch = async () => {
            try {
                if (Capacitor.isPluginAvailable("AndroidTV")) {
                    setAndroidTV((await AndroidTVPlugin.get()).value);
                }
            }
            catch (e: any) {
                console.error("ERROR ANDROID TV", e);
            }
        }
        fetch();
    }, []);

    useEffect(() => {
        if (currentTrack.id === "") {
            return;
        }
        const fetch = async () => {
            setCoverArt((await VLC.getAlbumArt({ id: currentTrack.coverArt })).value!);
        }
        fetch();
    }, [currentTrack, coverArt]);

    useEffect(() => {
        const get = async () => {
            const current = await VLC.getCurrentState();
            if(current.status === "ok"){
                setCurrentTrack(current.value?.currentTrack!);
                setPlaying(current.value?.playing!);
                setPlaytime(current.value?.playtime!);
            }
        };
        setTimeout(() => get(),500);
    },[]);

    const playNext = useCallback(() => {
        VLC.next();
    }, []);

    const playPrev = useCallback(() => {
        VLC.prev();
    }, []);

    const togglePlaying = () => {
        if (playing) {
            VLC.pause();
        }
        else {
            VLC.play();
        }
    };

    const goToAlbum = useCallback(() => {
        navigate(`/album`, { state: { id: currentTrack.parent } });
    }, [currentTrack]);

    const hide = useCallback(() => {
        if (currentTrack.id === "" || location.pathname.match(/playing/)) {
            return "d-none"
        }
        return "d-flex";
    }, [currentTrack, location.pathname]);
    useEffect(() => {
        const aw = async () => {
            listeners.current.forEach(async (listener) => {
                await listener.remove();
            });
            listeners.current = [
            await VLC.addListener('play', (info: any) => {
              setPlaying(true);
            }),
            await VLC.addListener('paused', (info: any) => {
              setPlaying(false);
            }),
            await VLC.addListener('stopped', (info: any) => {
              setPlaying(false);
            }),
            await VLC.addListener('currentTrack', (info: any) => {
              setCurrentTrack(info.currentTrack);
            }),
            await VLC.addListener('progress', (info: any) => {
              setPlaytime(info.time);
            })]
        }
        aw();

        return () => {
            //setCurrentTrack(CurrentTrackContextDefValue);
        }
    }, [setPlaying, setCurrentTrack, setPlaytime]);
    return (
        <div className={classnames("flex-column justify-content-between w-100", "mt-3", hide())}>
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
                            {playing ?
                                <FontAwesomeIcon icon={faPause}></FontAwesomeIcon> :
                                <FontAwesomeIcon icon={faPlay}></FontAwesomeIcon>
                            }
                        </button>
                        <button type="button" className="btn btn-link text-white" onClick={playNext}>
                            <FontAwesomeIcon icon={faForwardStep}></FontAwesomeIcon>
                        </button>
                    </div>
                    <div className={classnames("hide-mobile-flex", "flex-row", "align-items-center", "justify-content-center", androidTV ? "d-none" : "")}>
                        <FontAwesomeIcon icon={faVolumeLow} className="text-white" />
                        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => changeVolume(e)} className="mx-2"></input>
                        <FontAwesomeIcon icon={faVolumeHigh} className="text-white" />
                    </div>
                </div>
            </div>
            <div className="w-100 d-flex flex-row justify-content-between text-white">
                <span>{SecondsToHHSS((playtime ?? 0) * (currentTrack?.duration ?? 0))}</span>
                <span>{SecondsToHHSS(currentTrack.duration)}</span>
            </div>
            <div className="w-100 mb-3">
                <input disabled={androidTV} type="range" className="w-100" min={0} max={1} step={0.01} value={playtime} onChange={(e) => changePlayTime(e)}></input>
            </div>
        </div>
    )
}


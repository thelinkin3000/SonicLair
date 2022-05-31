import { faForwardStep, faPause, faPlay, faRotateLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, useCallback, useContext, useEffect, useState } from "react";
import { CurrentTrackContext } from "../AudioContext"
import { SecondsToHHSS } from "../Helpers";
import "./NowPlaying.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _, { } from 'lodash';
import { useNavigate } from "react-router-dom";
import VLC from "../Plugins/VLC";
// import AndroidTV from "../Plugins/AndroidTV";

export default function NowPlaying({ }) {
    const { currentTrack, setCurrentTrack } = useContext(CurrentTrackContext);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [playTime, setPlayTime] = useState<number>(0);
    const [coverArt, setCoverArt] = useState<string>("");
    const [androidTV, setAndroidTV] = useState<boolean>(false);


    const changePlayTime = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const time = parseFloat(e.target.value);
        VLC.seek({ time: time });
    }, [currentTrack]);

    useEffect(() => {
        if (currentTrack.id === "") {
            return;
        }
        const fetch = async () => {
            setCoverArt((await VLC.getAlbumArt({ id: currentTrack.coverArt })).value!);
        }
        fetch();
    }, [currentTrack, coverArt]);

    const playNext = useCallback(() => {
        VLC.next();
    }, []);

    const playPrev = useCallback(() => {
        VLC.prev();
    }, []);

    const togglePlaying = () => {
        if (isPlaying) {
            VLC.pause();
        }
        else {
            VLC.play();
        }
    };

    useEffect(() => {
        (VLC as any).removeAllListeners();
        // I'm sorry typescript gods.

        (VLC as any).addListener('play', (info: any) => {
            setIsPlaying(true);
        });
        (VLC as any).addListener('paused', (info: any) => {
            setIsPlaying(false);
        });
        (VLC as any).addListener('stopped', (info: any) => {
            setIsPlaying(false);
        });
        (VLC as any).addListener('progress', (info: any) => {
            setPlayTime(info.time);
        });
        (VLC as any).addListener('currentTrack', (info: any) => {
            setCurrentTrack(info.currentTrack);
        });

        return () => {
            //setCurrentTrack(CurrentTrackContextDefValue);

        }
    }, [currentTrack, isPlaying, setIsPlaying, setCurrentTrack]);

    return (
        <div className={"d-flex flex-column align-items-center justify-content-between h-100"}>
            <div className="m-auto"></div>
            <img className={"current-track-img-tv"} src={coverArt}></img>
            <div className={`current-track-header flex-row align-items-center justify-content-start`}>
                <div className="ml-2 flex-shrink-5  h-100 d-flex flex-column align-items-start justify-content-end text-center fade-right" >
                    <span className="text-white no-wrap w-100 section-header" style={{ overflow: "hidden", whiteSpace: "nowrap", fontWeight: 800 }}>{currentTrack.title}</span>
                    <span className="text-white no-wrap mb-0 w-100" style={{ overflow: "hidden", whiteSpace: "nowrap" }}>{currentTrack.album} - by {currentTrack.artist}</span>
                </div>
            </div>
            <div className="m-auto"></div>
            <div className="d-flex flex-row align-items-start justify-content-center p-0">
                <button type="button" className="btn btn-link text-white" onClick={playNext}>
                    <div className="d-flex flex-column align-items-center ">
                        <FontAwesomeIcon size="2x" icon={faRotateLeft}></FontAwesomeIcon>10s
                    </div>
                </button>
                <button type="button" className="btn btn-link text-white" onClick={playPrev}>
                    <FontAwesomeIcon flip="horizontal" size="2x" icon={faForwardStep}></FontAwesomeIcon>
                </button>
                <button type="button" className="btn btn-link text-white" onClick={togglePlaying}>
                    {isPlaying ?
                        <FontAwesomeIcon size="2x" icon={faPause}></FontAwesomeIcon> :
                        <FontAwesomeIcon size="2x" icon={faPlay}></FontAwesomeIcon>
                    }
                </button>
                <button type="button" className="btn btn-link text-white" onClick={playNext}>
                    <FontAwesomeIcon size="2x" icon={faForwardStep}></FontAwesomeIcon>
                </button>
                <button type="button" className="btn btn-link text-white" onClick={playNext}>
                <div className="d-flex flex-column align-items-center">
                        <FontAwesomeIcon size="2x" icon={faRotateRight}></FontAwesomeIcon>
                        <span style={{textDecorationLine:"none important!"}}>10s</span>
                    </div>
                </button>
            </div>
            <div className="w-50 d-flex flex-row justify-content-between text-white">
                <span>{SecondsToHHSS((playTime ?? 0) * (currentTrack?.duration ?? 0))}</span>
                <span>{SecondsToHHSS(currentTrack.duration)}</span>
            </div>
            <div className="w-50" style={{ marginBottom: "30px" }}>
                <input disabled type="range" className="w-100" min={0} max={1} step={0.01} value={playTime} onChange={(e) => changePlayTime(e)}></input>
            </div>
        </div>
    )
}
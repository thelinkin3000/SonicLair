import { faForwardStep, faPause, faPlay, faRotateLeft, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, useCallback, useContext, useEffect, useState } from "react";
import { CurrentTrackContext, CurrentTrackContextDefValue } from "../AudioContext"
import { SecondsToHHSS } from "../Helpers";
import "./NowPlaying.scss";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import _, { } from 'lodash';
import { useNavigate } from "react-router-dom";
import VLC from "../Plugins/VLC";
import { FocusContext, useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import classnames from "classnames";
import { IAlbumSongResponse } from "../Models/API/Responses/IArtistResponse";
// import AndroidTV from "../Plugins/AndroidTV";

export default function NowPlaying({ }) {
    const [currentTrack, setCurrentTrack] = useState<IAlbumSongResponse>(CurrentTrackContextDefValue);
    const [playing, setPlaying] = useState<boolean>(false);
    const [playtime, setPlaytime] = useState<number>(0);
    const [coverArt, setCoverArt] = useState<string>("");
    const changePlayTime = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        const time = parseFloat(e.target.value);
        VLC.seek({ time: time });
    }, [currentTrack]);

    const { ref, focusKey } = useFocusable();
    useEffect(() => {
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
    },[])

    const playNext = useCallback(() => {
        VLC.next();
    }, []);

    const playPrev = useCallback(() => {
        VLC.prev();
    }, []);

    const seekForward = useCallback(() => {
        VLC.seek({ time: Math.min(playtime + ((1 / currentTrack.duration) * 10), 1) });
    }, [currentTrack, playtime]);
    const seekBackward = useCallback(() => {
        VLC.seek({ time: Math.max(playtime - ((1 / currentTrack.duration) * 10), 0) });
    }, [currentTrack, playtime]);

    const togglePlaying = () => {
        if (playing) {
            VLC.pause();
        }
        else {
            VLC.play();
        }
    };
    useEffect(() => {
        // I'm sorry typescript gods.
        VLC.removeAllListeners();
        VLC.addListener('play', (info: any) => {
          setPlaying(true);
        });
        (VLC as any).addListener('paused', (info: any) => {
          setPlaying(false);
        });
        (VLC as any).addListener('stopped', (info: any) => {
          setPlaying(false);
        });
        (VLC as any).addListener('currentTrack', (info: any) => {
          setCurrentTrack(info.currentTrack);
        });
        (VLC as any).addListener('progress', (info: any) => {
          setPlaytime(info.time);
        });
    
        return () => {
          //setCurrentTrack(CurrentTrackContextDefValue);
        }
      }, [setPlaying, setCurrentTrack, setPlaytime]);

    return (
        <div className={"d-flex flex-column align-items-center justify-content-between h-100"}>
            <div className="m-auto"></div>
            <img className={classnames("current-track-img-tv")} src={coverArt}></img>
            <div className={`current-track-header flex-row align-items-center justify-content-start`}>
                <div className="ml-2 flex-shrink-5  h-100 d-flex flex-column align-items-start justify-content-end text-center fade-right" >
                    <span className="text-white no-wrap w-100" style={{ overflow: "hidden", whiteSpace: "nowrap", fontWeight: 800 }}>{currentTrack.title}</span>
                    <span className="text-white no-wrap mb-0 w-100" style={{ overflow: "hidden", whiteSpace: "nowrap" }}>{currentTrack.album} - by {currentTrack.artist}</span>
                </div>
            </div>
            <div className="m-auto"></div>
            <FocusContext.Provider value={focusKey}>
                <div className="d-flex flex-row align-items-start justify-content-center p-0" ref={ref}>
                    <TVActionButton func={seekBackward} content={(<><i className="ri-rewind-fill"></i>10s</>)}></TVActionButton>
                    <TVActionButton func={playPrev} content={(<i className="ri-arrow-left-fill"></i>)}></TVActionButton>
                    <TVActionButton func={togglePlaying} content={playing ?
                        <i className="ri-pause-fill"></i> :
                        <i className="ri-play-fill"></i>} preferred={true}></TVActionButton>
                    <TVActionButton func={playNext} content={(<i className="ri-arrow-right-fill"></i>)}></TVActionButton>
                    <TVActionButton func={seekForward} content={(<><i className="ri-speed-fill"></i>10s</>)}></TVActionButton>
                </div>
            </FocusContext.Provider>
            <div className="w-50 d-flex flex-row justify-content-between text-white">
                <span>{SecondsToHHSS((playtime ?? 0) * (currentTrack?.duration ?? 0))}</span>
                <span>{SecondsToHHSS(currentTrack.duration)}</span>
            </div>
            <div className="w-50" style={{ marginBottom: "30px" }}>
                <input disabled type="range" className="w-100" min={0} max={1} step={0.01} value={playtime} onChange={(e) => changePlayTime(e)}></input>
            </div>
        </div>
    )
}

interface TVActionButtonProps {
    func: () => void;
    content: any;
    preferred?: boolean;
}

function TVActionButton({ func, content, preferred }: TVActionButtonProps) {
    const { ref, focused, focusSelf } = useFocusable({ onEnterPress: func });
    useEffect(() => {
        if(preferred){
            focusSelf();
        }
    },[preferred])
    return (
        <div ref={ref} className={classnames("m-2", "p-2", "text-white", "tv-button", focused ? "btn-tv-selected" : "")} onClick={func}>
            <div className="d-flex flex-column align-items-center ">
                {content}
            </div>
        </div>
    )
}
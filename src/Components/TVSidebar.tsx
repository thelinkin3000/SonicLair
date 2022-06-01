import { faHouseChimney, faMagnifyingGlass, faUser, faUserAlt, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./TVSidebar.scss";
import { useNavigate } from "react-router-dom";
import { faPlayCircle } from "@fortawesome/free-regular-svg-icons";
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import classnames from "classnames";
import { useCallback, useContext, useEffect } from "react";
import VLC from "../Plugins/VLC";
import { CurrentTrackContext } from "../AudioContext";

export default function TVSidebar() {
    const { ref, focusKey, focusSelf, hasFocusedChild } = useFocusable({trackChildren: true});
    const {setPlaying, setCurrentTrack, setPlaytime} = useContext(CurrentTrackContext);
    useEffect(() => {
        setTimeout(() => focusSelf(),500);
    },[])
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

        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className={classnames("d-flex","flex-column", hasFocusedChild ? "sidebar-tv-focused" : "sidebar-tv")}>
                <TVSidebarButton path="/home" icon={faHouseChimney} text="Home" />
                <TVSidebarButton path="/search" icon={faMagnifyingGlass} text="Search" />
                <TVSidebarButton path="/account" icon={faUserAlt} text="Account" />
                <div className="m-auto"></div>
                <TVSidebarButton path="/playing" icon={faPlayCircle} text="Now Playing" />
                
            </div>
        </FocusContext.Provider>
    )
}

interface TVSidebarButtonProps {
    path: string;
    text: string;
    icon: IconDefinition;
}

function TVSidebarButton({ path, text, icon }: TVSidebarButtonProps) {
    const navigate = useNavigate();
    const nav = useCallback(() => {
        navigate(path)

    },[path, navigate]);
    const { ref, focused } = useFocusable({onEnterPress:nav});
    return (
        <div ref={ref} onClick={nav}
            className={classnames("sidebar-item", "d-flex", "align-items-center", "justify-content-start", "text-white", "p-3", "mb-3", focused ? "sidebar-item-focused" : "")}>
            <FontAwesomeIcon icon={icon} />
            <span className="item-text">{text}</span>
        </div>)
}
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
    useEffect(() => {
        setTimeout(() => focusSelf(),500);
    },[])
    
    return (

        <FocusContext.Provider value={focusKey}>
            <div ref={ref} className={classnames("d-flex","flex-column", hasFocusedChild ? "sidebar-tv-focused" : "sidebar-tv")}>
                <TVSidebarButton path="/home" icon={(<i className="ri-home-fill icon-large-tv"></i>)} text="Home" />
                <TVSidebarButton path="/search" icon={<i className="ri-search-2-fill icon-large-tv"></i>} text="Search" />
                <TVSidebarButton path="/account" icon={<i className="ri-user-fill icon-large-tv"></i>} text="Account" />
                <div className="m-auto"></div>
                <TVSidebarButton path="/playing" icon={<i className="ri-play-circle-fill icon-large-tv"></i>} text="Playing" />
                
            </div>
        </FocusContext.Provider>
    )
}

interface TVSidebarButtonProps {
    path: string;
    text: string;
    icon: any;
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
            {icon}
            <span className="item-text">{text}</span>
        </div>)
}
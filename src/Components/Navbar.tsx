import { Capacitor } from "@capacitor/core";
import { faCircleLeft } from "@fortawesome/free-regular-svg-icons";
import { faBurger, faCircleChevronLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.svg";
import "./Navbar.scss";

export default function Navbar({ setNavbarCollapsed, navbarCollapsed }: { navbarCollapsed: boolean, setNavbarCollapsed: Dispatch<SetStateAction<boolean>> }) {
    const navigate = useNavigate();
    const [hasBack, setHasBack] = useState<boolean>(false);
    useEffect(() => {
        if (Capacitor.getPlatform() !== "android") {
            setHasBack(true);
        }

    }, [])
    return (<div className="d-flex flex-row align-items-center justify-content-between mb-2 sonic-navbar">
        <button className="btn btn-link text-white" style={{ opacity: hasBack ? 1 : 0 }} onClick={() => { hasBack && navigate(-1)  }}>
            <FontAwesomeIcon icon={faCircleLeft} />
        </button>
        <img src={logo} className="logo-header" alt="logo" />

        <button className="btn btn-link text-white" onClick={() => { setNavbarCollapsed(!navbarCollapsed) }}>
            <FontAwesomeIcon icon={faBurger} />
        </button>

    </div>)
}
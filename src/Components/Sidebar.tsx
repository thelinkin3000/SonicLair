import { faBurger, faCompactDisc, faHouseChimney, faUserAlt, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classnames from "classnames";
import { MotionConfig } from "framer-motion";
import { Dispatch, SetStateAction, useEffect } from "react";
import "./Sidebar.scss";
import { motion, useAnimation } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { faUser } from "@fortawesome/free-regular-svg-icons";


export default function Sidebar({ setNavbarCollapsed, navbarCollapsed }: { navbarCollapsed: boolean, setNavbarCollapsed: Dispatch<SetStateAction<boolean>> }) {
    const controls = useAnimation();
    const navigate = useNavigate();
    const variants = {
        visible: { opacity: 1, scale:1 },
        hidden: { opacity: 0, scale:0 },
    };

    const nav = (path: string) => {
        setNavbarCollapsed(true);
        navigate(path);
    }
    return (
        <>
            <motion.div
                initial="hidden"
                animate={navbarCollapsed ? "hidden" : "visible"}
                variants={variants}
                className={classnames("d-flex", "flex-column", "sidebar", "align-items-center", "justify-content-start")}
                transition={{ duration: 0.05 }}
            >

                {/* <div onClick={() => { setNavbarCollapsed(!navbarCollapsed) }} className="sidebar-item-borderless d-flex align-items-center justify-content-center text-white" ><FontAwesomeIcon icon={faBurger} /></div> */}
                <div onClick={() => nav("/")} className="sidebar-item d-flex align-items-center justify-content-center text-white"><FontAwesomeIcon icon={faHouseChimney} /></div>
                <div onClick={() => nav("/artists")} className="sidebar-item d-flex align-items-center justify-content-center text-white"><FontAwesomeIcon icon={faUsers} /></div>
                <div onClick={() => nav("/albums")} className="sidebar-item d-flex align-items-center justify-content-center text-white"><FontAwesomeIcon icon={faCompactDisc} /></div>
                <div className="sidebar-item last-item d-flex align-items-center justify-content-center text-white"><FontAwesomeIcon icon={faUserAlt} /></div>

            </motion.div>
            <div onClick={() => setNavbarCollapsed(true)} className={`${navbarCollapsed ? "d-none" : "modal-cover"}`}></div>
        </>
    )
}
import {
    faCompactDisc,
    faHouseChimney,
    faListOl,
    faMagnifyingGlass,
    faQrcode,
    faUserAlt,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classnames from "classnames";
import { Dispatch, SetStateAction } from "react";
import "./Sidebar.scss";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

export default function Sidebar({
    setNavbarCollapsed,
    navbarCollapsed,
}: {
    navbarCollapsed: boolean;
    setNavbarCollapsed: Dispatch<SetStateAction<boolean>>;
}) {
    const navigate = useNavigate();
    const variants = {
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 0 },
    };

    const nav = (path: string) => {
        setNavbarCollapsed(true);
        navigate(path);
    };

    return (
        <>
            <motion.div
                initial="hidden"
                animate={navbarCollapsed ? "hidden" : "visible"}
                variants={variants}
                className={classnames(
                    "d-flex",
                    "flex-column",
                    "sidebar",
                    "align-items-center",
                    "justify-content-start"
                )}
                transition={{ duration: 0.05 }}
            >
                {/* <div onClick={() => { setNavbarCollapsed(!navbarCollapsed) }} className="sidebar-item-borderless d-flex align-items-center justify-content-center text-white" ><FontAwesomeIcon icon={faBurger} /></div> */}
                <div
                    onClick={() => nav("/home")}
                    className="sidebar-item d-flex align-items-center justify-content-center text-white"
                >
                    <FontAwesomeIcon icon={faHouseChimney} />
                </div>
                <div
                    onClick={() => nav("/artists")}
                    className="sidebar-item d-flex align-items-center justify-content-center text-white"
                >
                    <FontAwesomeIcon icon={faUsers} />
                </div>
                <div
                    onClick={() => nav("/albums")}
                    className="sidebar-item d-flex align-items-center justify-content-center text-white"
                >
                    <FontAwesomeIcon icon={faCompactDisc} />
                </div>
                <div
                    onClick={() => nav("/search")}
                    className="sidebar-item d-flex align-items-center justify-content-center text-white"
                >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                </div>
                <div
                    onClick={() => nav("/playlists")}
                    className="sidebar-item d-flex align-items-center justify-content-center text-white"
                >
                    <FontAwesomeIcon icon={faListOl} />
                </div>
                {Capacitor.getPlatform() === "android" && (
                    <div
                        onClick={() => nav("/qr")}
                        className="sidebar-item d-flex align-items-center justify-content-center text-white"
                    >
                        <FontAwesomeIcon icon={faQrcode} />
                    </div>
                )}

                <div
                    onClick={() => nav("/account")}
                    className="sidebar-item last-item d-flex align-items-center justify-content-center text-white"
                >
                    <FontAwesomeIcon icon={faUserAlt} />
                </div>
            </motion.div>
            <div
                onClick={() => setNavbarCollapsed(true)}
                className={`${navbarCollapsed ? "d-none" : "modal-cover"}`}
            ></div>
        </>
    );
}

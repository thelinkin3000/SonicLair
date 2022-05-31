import { faHouseChimney, faMagnifyingGlass, faUserAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./TVSidebar.scss";
import { useNavigate } from "react-router-dom";
import { faPlayCircle } from "@fortawesome/free-regular-svg-icons";


export default function TVSidebar() {
    const navigate = useNavigate();

    const nav = (path: string) => {
        navigate(path);
    };

    return (
        <div className="sidebar-tv d-flex flex-column">
            <div onClick={() => nav("/home")}
                className="sidebar-item d-flex align-items-center justify-content-start text-white p-3 mt-3">
                <FontAwesomeIcon icon={faHouseChimney} />
                <span className="item-text">Home</span>
            </div>
            <div onClick={() => nav("/search")}
                className="sidebar-item d-flex align-items-center justify-content-start text-white p-3">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <span className="item-text">Search</span>
            </div>
            <div onClick={() => nav("/account")}
                className="sidebar-item last-item d-flex align-items-center justify-content-start text-white p-3">
                <FontAwesomeIcon icon={faUserAlt} />
                <span className="item-text">Account</span>
            </div>
            <div className="m-auto"></div>
            <div onClick={() => nav("/playing")}
                className="sidebar-item last-item d-flex align-items-center justify-content-start text-white p-3 mb-3">
                <FontAwesomeIcon icon={faPlayCircle} />
                <span className="item-text">Playing</span>
            </div>
        </div>
    )
}

import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import "./Account.scss";

export default function Account() {
    const { context, setContext } = useContext(AppContext);
    const navigate = useNavigate();
    const logout = useCallback(() => {
        const newContext = {
            username: null, 
            url: "", 
            password: "", 
            type: ""
        };
        setContext(newContext);
    }, [context, setContext]);

    return (<div className="d-flex flex-column align-items-center justify-content-start h-100">
        <div className="text-white account-icon-container">
            <FontAwesomeIcon icon={faUser} size="5x"></FontAwesomeIcon>
        </div>
        <div className="text-header text-white">
            {context.username}
        </div>
        <div className="text-white">
            on {context.url}
        </div>
        <div className="text-white">
            running {context.type}
        </div>
        <div className="logout-button-container" >
            <button className="btn btn-primary mt-10" onClick={logout}>Logout</button>
        </div>

    </div>)
}
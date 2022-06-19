import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { Toast } from "@capacitor/toast";
import { faCircleLeft } from "@fortawesome/free-regular-svg-icons";
import { faBurger, faTv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import logo from "../logo.svg";
import VLC from "../Plugins/VLC";
import "./Navbar.scss";

export default function Navbar({
    setNavbarCollapsed,
    navbarCollapsed,
}: {
    navbarCollapsed: boolean;
    setNavbarCollapsed: Dispatch<SetStateAction<boolean>>;
}) {
    const navigate = useNavigate();
    const [hasBack, setHasBack] = useState<boolean>(false);
    const listener = useRef<PluginListenerHandle>();
    useEffect(() => {
        if (Capacitor.getPlatform() !== "android") {
            setHasBack(true);
        }
    }, []);
    const [websocketConnected, setWebsocketConnected] =
        useState<boolean>(false);
    useEffect(() => {
        const fetch = async () => {
            if (listener.current) {
                listener.current.remove();
            }
            listener.current = await VLC.addListener(
                "webSocketConnection",
                (info: any) => {
                    setWebsocketConnected(info.connected);
                }
            );
            var ret = await VLC.getWebsocketStatus();
            if (ret.status === "ok") {
                setWebsocketConnected(ret.value!);
            } else {
                setWebsocketConnected(false);
            }
        };
        fetch();
    }, []);
    const disconnectWebSocket = useCallback(async () => {
        const ret = await VLC.disconnectWebsocket();
        if (ret.status === "ok") {
            Toast.show({ text: "TV disconnected" });
        } else {
            Toast.show({ text: ret.error });
        }
    }, []);

    return (
        <div className="d-flex flex-row align-items-center justify-content-between mb-2 sonic-navbar">
            <div className="w-100 d-flex flex-row align-items-center justify-content-start">
                {hasBack && (
                    <button
                        className="btn btn-link text-white"
                        onClick={() => {
                            navigate(-1);
                        }}
                    >
                        <FontAwesomeIcon icon={faCircleLeft} />
                    </button>
                )}
                {websocketConnected && (
                    <button
                        className="btn btn-link text-white"
                        onClick={disconnectWebSocket}
                    >
                        <FontAwesomeIcon icon={faTv} />
                    </button>
                )}
            </div>
            <img src={logo} className="logo-header" alt="logo" />

            <div className="w-100 d-flex flex-row align-items-center justify-content-end">
                <button
                    className="btn btn-link text-white"
                    onClick={() => {
                        setNavbarCollapsed(!navbarCollapsed);
                    }}
                >
                    <FontAwesomeIcon icon={faBurger} />
                </button>
            </div>
        </div>
    );
}

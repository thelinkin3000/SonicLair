import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import { PluginListenerHandle } from "@capacitor/core";
import { Toast } from "@capacitor/toast";
import { faTv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import VLC from "../Plugins/VLC";

export default function QRScan() {
    const [show, setShow] = useState<boolean>(true);
    const scanning = useRef<Boolean>(false);
    const handler = useRef<NodeJS.Timeout>();
    const vlcHandler = useRef<PluginListenerHandle>();
    const [nearTvs, setNearTvs] = useState<string[]>([]);
    const registered = useRef<Boolean>(false);
    const navigate = useNavigate();
    const enableScanner = useCallback(async () => {
        scanning.current = true;
        setShow(false);
        document.body.classList.add("body-transparent");
        await BarcodeScanner.hideBackground(); // make background of WebView transparent
    }, []);

    const disableScanner = useCallback(async () => {
        if (scanning.current) {
            setShow(true);
            scanning.current = false;
            BarcodeScanner.showBackground();
            BarcodeScanner.stopScan();
            document.body.classList.remove("body-transparent");
        }
    }, []);

    useEffect(() => {
        const f = async () => {
            if (vlcHandler.current !== undefined) {
                await vlcHandler.current.remove();
            }
            vlcHandler.current = await VLC.addListener(
                "tvPacket",
                (info: any) => {
                    setNearTvs([...nearTvs, info.ip]);
                }
            );
            if (!registered.current) {
                setTimeout(async () => {
                    await VLC.sendUdpBroadcast();
                    registered.current = true;
                }, 500);
            }
        };
        f();
    }, [nearTvs]);

    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            disableScanner();
        };
    }, [disableScanner]);

    const connect = useCallback(
        async (ip: string) => {
            let ret = await VLC.qrLogin({ ip });
            if (ret.status === "error") {
                Toast.show({ text: ret.error });
            } else {
                navigate("/home");
            }
        },
        [navigate]
    );

    const scan = async () => {
        const permission = await VLC.getCameraPermissionStatus();
        if (permission.status !== "ok") {
            await Toast.show({ text: permission.error });
            VLC.getCameraPermission();
            return;
        }

        if (handler.current !== undefined) {
            clearTimeout(handler.current);
        }

        handler.current = setTimeout(() => {
            Toast.show({
                text: "Didn't find any QR codes. Want to try again?",
            });
            disableScanner();
        }, 10000);

        await enableScanner();
        const result = await BarcodeScanner.startScan(); // start scanning and wait for a result
        // if the result has content
        if (result.hasContent) {
            disableScanner();
            clearTimeout(handler.current);
            handler.current = undefined;
            connect(result.content!);
        }
    };

    return (
        <div className="d-flex flex-column h-100 w-100 align-items-center justify-content-center">
            <button
                className={classNames(
                    "btn",
                    "btn-primary",
                    show ? "" : "d-none"
                )}
                onClick={scan}
            >
                Scan QR from TV
            </button>
            {nearTvs.length > 0 && (
                <>
                    <span className="subtitle text-white m-3">
                        Tap on any item to connect without a QR Code
                    </span>
                    {nearTvs.map((s) => (
                        <div
                            className="list-group-item text-center text-white"
                            onClick={() => {
                                // Connect in jukebox mode
                                connect(`${s}j`);
                            }}
                        >
                            <FontAwesomeIcon icon={faTv} /> {s}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

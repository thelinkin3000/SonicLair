import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import { Toast } from "@capacitor/toast";
import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import VLC from "../Plugins/VLC";

export default function QRScan() {
    const [show, setShow] = useState<boolean>(true);
    const scanning = useRef<Boolean>(false);
    const handler = useRef<NodeJS.Timeout>();

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
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            disableScanner();
        };
    }, [disableScanner]);

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
            let ret = await VLC.qrLogin({ ip: result.content! });
            if (ret.status === "error") {
                Toast.show({ text: ret.error });
            }
        }
    };

    return (
        <div className="d-flex h-100 w-100 align-items-center justify-content-center">
            <button
                className={classNames(
                    "btn",
                    "btn-primary",
                    show ? "" : "d-none"
                )}
                onClick={scan}
            >
                Scan code!
            </button>
        </div>
    );
}

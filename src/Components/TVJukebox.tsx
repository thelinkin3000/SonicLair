import { useEffect, useState } from "react";
import { QRCode } from "react-qrcode-logo";
import AndroidTVPlugin from "../Plugins/AndroidTV";

export default function TVJukebox() {
    const [localIp, setLocalIp] = useState<string>("");
    useEffect(() => {
        const fetch = async () => {
            const androidTv = (await AndroidTVPlugin.get()).value;
            if (androidTv) {
                setLocalIp((await AndroidTVPlugin.getIp()).value);
            }
        };
        fetch();
    }, []);

    return (
        <div className="h-100 w-100 d-flex flex-column align-items-center justify-content-center">
            <div className="section-header text-white mb-3">
                Connect your phone's SonicLair
            </div>
            <div
                className="p-5 d-flex align-items-center justify-content-around"
                style={{
                    backgroundColor: "white",
                    borderRadius: "5px",
                }}
            >
                <QRCode
                    style={{ borderRadius: "5px" }}
                    qrStyle="dots"
                    eyeRadius={5}
                    removeQrCodeBehindLogo={true}
                    bgColor="#282c34"
                    fgColor="#ebebeb"
                    ecLevel="H"
                    value={`${localIp}j`}
                ></QRCode>
            </div>
            <span className="text-white">{localIp}</span>
        </div>
    );
}

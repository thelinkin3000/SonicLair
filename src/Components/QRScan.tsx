import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Toast } from '@capacitor/toast';
import classNames from 'classnames';
import { useCallback, useContext, useState } from 'react';
import { AppContext } from '../AppContext';

function ValidateIPaddress(ipaddress: string): boolean {
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
        return true
    }
    return false
}

export default function QRScan() {
    const { context } = useContext(AppContext);
    const [show, setShow] = useState<boolean>(true);
    const startScan = async () => {
        console.log("adding class");
        setShow(false);
        document.body.classList.add("body-transparent");
        setTimeout(() => {
            Toast.show({ text: "Didn't find any QR codes. Want to try again?" });
            setShow(true);
            BarcodeScanner.showBackground();
            BarcodeScanner.stopScan();
            document.body.classList.remove("body-transparent");
        }, 10000);
        await BarcodeScanner.hideBackground(); // make background of WebView transparent
        const result = await BarcodeScanner.startScan(); // start scanning and wait for a result
        // if the result has content
        if (result.hasContent) {
            setShow(true);
            BarcodeScanner.showBackground();
            BarcodeScanner.stopScan();
            document.body.classList.remove("body-transparent");
            if(ValidateIPaddress(result.content!)){
                try {
                    Toast.show({ text: `Connecting to ${result.content}` });
                    let socket = new WebSocket(`ws://${result.content}:30001`);
                    socket.onopen = () => {
                        let outgoingMessage = JSON.stringify({ type: "login", data: context });
                        socket.send(outgoingMessage);
                        Toast.show({ text: `Login data sent` });
                    };
                    socket.onerror = () => {
                        Toast.show({text: `Error connecting to server.`});
                    }
                }
                catch (e: any) {
                    Toast.show({ text: e.message });
                }
            }
            else{
                Toast.show({text: "The QR code is not an IP address. Please try again."});
            }
            
        }
        
    };
    return (
        <div className="d-flex h-100 w-100 align-items-center justify-content-center">
            <button className={classNames("btn","btn-primary", show ? "" : "d-none")} onClick={startScan}>Scan code!</button>
        </div>)
}
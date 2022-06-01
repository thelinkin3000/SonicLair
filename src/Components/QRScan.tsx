import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

export default function QRScan() {

    const startScan = async () => {
        BarcodeScanner.hideBackground(); // make background of WebView transparent

        const result = await BarcodeScanner.startScan(); // start scanning and wait for a result

        // if the result has content
        if (result.hasContent) {
            console.log(result.content); // log the raw scanned content
        }
        setTimeout(() => {
            BarcodeScanner.showBackground();
            BarcodeScanner.stopScan();
        }, 10000);
    };
    return (
    <div className="d-flex h-100 w-100 align-items-center justify-content-center">
        <button className="btn btn-primary" onClick={startScan}>Scan code!</button>
    </div>)
}
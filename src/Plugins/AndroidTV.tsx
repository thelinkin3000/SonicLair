import { SupportedFormat } from '@capacitor-community/barcode-scanner';
import { Plugin, registerPlugin, WebPlugin } from '@capacitor/core';

export interface IAndroidTVResponse {
    value: boolean;
}

export interface IAndroidTVStringResponse{
    value: string;
}

export interface IAndroidTVPlugin extends Plugin{
    get(): Promise<IAndroidTVResponse>;
    getIp(): Promise<IAndroidTVStringResponse>;
}

class AndroidTV extends WebPlugin implements IAndroidTVPlugin{
    constructor() {
        super();
    }
    get(): Promise<IAndroidTVResponse> {
        return Promise.resolve({ value: false });
    }
    getIp(): Promise<IAndroidTVStringResponse> {
        return Promise.resolve({ value: "127.0.0.1" });
    }
}

const AndroidTVPlugin = registerPlugin<IAndroidTVPlugin>('AndroidTV', {
    web: () => new AndroidTV(),
});

export default AndroidTVPlugin;
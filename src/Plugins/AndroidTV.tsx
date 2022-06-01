import { registerPlugin } from '@capacitor/core';

export interface IAndroidTVResponse {
    value: boolean;
}

export interface IAndroidTVStringResponse{
    value: string;
}

export interface IBackendPlugin {
    get(): Promise<IAndroidTVResponse>;
    getIpAddr(): Promise<IAndroidTVStringResponse>;
}

class AndroidTVPlugin implements IBackendPlugin {
    constructor() {

    }
    get(): Promise<IAndroidTVResponse> {
        return Promise.resolve({ value: true });
    }
    getIpAddr(): Promise<IAndroidTVStringResponse> {
        return Promise.resolve({ value: "192.168.137.1" });
    }
}

const AndroidTV = registerPlugin<IBackendPlugin>('AndroidTV', {
    web: () => new AndroidTVPlugin(),
});

export default AndroidTV;
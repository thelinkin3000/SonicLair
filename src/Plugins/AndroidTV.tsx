import { registerPlugin } from '@capacitor/core';

export interface IAndroidTVResponse {
    value: boolean;
}

export interface IBackendPlugin {
    get(): Promise<IAndroidTVResponse>;
}

class AndroidTVPlugin implements IBackendPlugin {
    constructor() {

    }
    get(): Promise<IAndroidTVResponse> {
        return Promise.resolve({ value: true });
    }
}

const AndroidTV = registerPlugin<IBackendPlugin>('AndroidTV', {
    web: () => new AndroidTVPlugin(),
});

export default AndroidTV;
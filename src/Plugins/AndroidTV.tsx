import { registerPlugin } from '@capacitor/core';

export interface IAndroidTVResponse {
    value: boolean;
}

export interface IBackendPlugin {
    get(): Promise<IAndroidTVResponse>;
}

const AndroidTV = registerPlugin<IBackendPlugin>('AndroidTV');

export default AndroidTV;
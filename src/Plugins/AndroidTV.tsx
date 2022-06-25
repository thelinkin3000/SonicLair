import { Plugin, registerPlugin, WebPlugin } from "@capacitor/core";

export interface IAndroidTVResponse {
    value: boolean;
}

export interface IAndroidTVStringResponse {
    value: string;
}

export interface IAndroidTVPlugin extends Plugin {
    get(): Promise<IAndroidTVResponse>;
    getIp(): Promise<IAndroidTVStringResponse>;
}

class AndroidTV extends WebPlugin implements IAndroidTVPlugin {
    get(): Promise<IAndroidTVResponse> {
        const ret =
            window.navigator.userAgent.indexOf("Tizen") > -1 ||
            window.navigator.userAgent.indexOf("WebOS") > -1 ||
            window.navigator.userAgent.indexOf("Xbox") > -1 || true;
        return Promise.resolve({ value: ret });
    }
    getIp(): Promise<IAndroidTVStringResponse> {
        return Promise.resolve({ value: "127.0.0.1" });
    }
}

const AndroidTVPlugin = registerPlugin<IAndroidTVPlugin>("AndroidTV", {
    web: () => new AndroidTV(),
});

export default AndroidTVPlugin;

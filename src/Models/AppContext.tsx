export interface IAppContext {
    activeAccount: IAccount;
    accounts: IAccount[];
    spotifyToken: string;
}

export interface IAccount {
    username: string | null;
    password: string;
    url: string;
    type: string;
    usePlaintext: boolean
}

export interface IAudioContext {
    audio: HTMLAudioElement;
}

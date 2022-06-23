import { IAlbumSongResponse } from "./Models/API/Responses/IArtistResponse";

export function GetAsParams(data: any): string {
    return GetAsUrlParams(data).toString();
}

export function GetAsUrlParams(data: any): URLSearchParams {
    let params = new URLSearchParams(data);
    let keysForDel: string[] = [];
    params.forEach((value, key) => {
        if (value === "undefined") {
            keysForDel.push(key);
        }
    });

    keysForDel.forEach((key) => {
        params.delete(key);
    });
    return params;
}

export function SecondsToHHSS(data: number) {
    try {
        return new Date(data * 1000).toISOString().substr(14, 5);
    } catch {
        return "00:00";
    }
}

export function onlyUnique(value: any, index: any, self: any) {
    return self.indexOf(value) === index;
}

export function getPlaylistDuration(playlist: IAlbumSongResponse[]) {
    return playlist.reduce<number>((prev, curr) => {
        return prev + curr.duration;
    }, 0);
}

import React, { useState, useMemo, SetStateAction, Dispatch } from "react";
import { IAlbumSongResponse } from "./Models/API/Responses/IArtistResponse";
import { IAppContext, IAudioContext } from "./Models/AppContext";



export const CurrentTrackContextDefValue: IAlbumSongResponse = {
    duration: 0, id: 0, parent: 0, title: "", track: 0, artist: "", coverArt: ""
}

export const CurrentTrackContext = React.createContext<
    {
        currentTrack: IAlbumSongResponse,
        setCurrentTrack: Dispatch<SetStateAction<IAlbumSongResponse>>,
        playlist: IAlbumSongResponse[],
        setPlaylist: Dispatch<SetStateAction<IAlbumSongResponse[]>>,
        setPlaylistAndPlay: (p: IAlbumSongResponse[], track:number) => void
    }>
    ({ currentTrack: CurrentTrackContextDefValue, setCurrentTrack: (c) => { }, playlist: [], setPlaylist: (c) => { }, setPlaylistAndPlay: (a,c) => {} });
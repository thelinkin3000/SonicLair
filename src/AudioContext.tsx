import React, { SetStateAction, Dispatch } from "react";
import { IAlbumSongResponse } from "./Models/API/Responses/IArtistResponse";



export const CurrentTrackContextDefValue: IAlbumSongResponse = {
    duration: 0, id: "", parent: "", title: "", track: 0, artist: "", coverArt: "", album: "", albumId: ""
}

export const CurrentTrackContext = React.createContext<
    {
        currentTrack: IAlbumSongResponse,
        setCurrentTrack: Dispatch<SetStateAction<IAlbumSongResponse>>,
        playing: boolean,
        setPlaying: Dispatch<SetStateAction<boolean>>,
        playtime: number,
        setPlaytime: Dispatch<SetStateAction<number>>,
    }>
    ({ 
        currentTrack: CurrentTrackContextDefValue, 
        setCurrentTrack: (c) => { }, 
        playing: false, 
        setPlaying: (c)=>{}, 
        playtime: 0, 
        setPlaytime: () => {}});
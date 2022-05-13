import React, { useState, useMemo, SetStateAction, Dispatch } from "react";
import { IAppContext, IAudioContext } from "./Models/AppContext";

export const AudioContextDefValue: IAudioContext = {
    audio: new Audio()
};



export const AudioContext = React.createContext<{ audioContext: IAudioContext, setAudioContext: Dispatch<SetStateAction<IAudioContext>> }>
    ({ audioContext: AudioContextDefValue, setAudioContext: (c) => { } });
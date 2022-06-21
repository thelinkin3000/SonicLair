import React, { SetStateAction, Dispatch } from "react";
import { IAccount } from "./Models/AppContext";

export const AppContextDefValue: IAccount = {
    username: "",
    password: "",
    url: "",
    type: "",
    usePlaintext: false,
};

export const AppContext = React.createContext<{ context: IAccount, setContext: Dispatch<SetStateAction<IAccount>> }>
    ({ context: AppContextDefValue, setContext: (c) => { } });

export interface IMenuContext {
    x: number;
    y: number;
    show: boolean;
    body: any;
}
export const MenuContextDefValue: IMenuContext = {
    x: 0,
    y: 0,
    show: false,
    body: <></>

}

export const MenuContext = React.createContext<{ menuContext: IMenuContext, setMenuContext: Dispatch<SetStateAction<IMenuContext>> }>
    ({ menuContext: MenuContextDefValue, setMenuContext: (c) => { } });

export interface IStateContext {
    selectedAlbum: number[];
    selectedArtist: number[];
}

export const StateContextDefValue: IStateContext = {
    selectedAlbum: [0,0],
    selectedArtist: [0,0],
}

export const StateContext = React.createContext<{ stateContext: IStateContext, setStateContext: Dispatch<SetStateAction<IStateContext>> }>
    ({ stateContext: StateContextDefValue, setStateContext: () => { } });
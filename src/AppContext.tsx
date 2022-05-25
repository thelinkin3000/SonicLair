import React, { useState, useMemo, SetStateAction, Dispatch } from "react";
import { IAppContext } from "./Models/AppContext";

export const AppContextDefValue: IAppContext = {
    activeAccount: {
        username: "",
        password: "",
        url: "",
        type: "",
    },
    accounts: [],
    spotifyToken: "",
};



export const AppContext = React.createContext<{ context: IAppContext, setContext: Dispatch<SetStateAction<IAppContext>> }>
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
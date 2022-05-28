import React, { useState, useMemo, SetStateAction, Dispatch } from "react";
import { IAccount, IAppContext } from "./Models/AppContext";

export const AppContextDefValue: IAccount = {
    username: "",
    password: "",
    url: "",
    type: "",

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
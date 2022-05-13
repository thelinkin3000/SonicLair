import React, {useState, useMemo, SetStateAction, Dispatch }from "react";
import { IAppContext } from "./Models/AppContext";

export const AppContextDefValue: IAppContext = {
    username: "",
    password: "",
    url: ""
};



export const AppContext = React.createContext<{context: IAppContext, setContext: Dispatch<SetStateAction<IAppContext>>}>
({context:AppContextDefValue,setContext:(c) => {} });
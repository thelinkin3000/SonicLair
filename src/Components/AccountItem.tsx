import { faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext } from "react";
import { AppContext } from "../AppContext";
import { IAccount, IAppContext } from "../Models/AppContext";
import "./AccountItem.scss";
import { v4 as uuidv4 } from 'uuid';
import md5 from "js-md5";
import axios from "axios";
import { ISubsonicResponse } from "../Models/API/Responses/SubsonicResponse";
import { useNavigate } from "react-router-dom";
import { IBasicParams } from "../Models/API/Requests/BasicParams";
import { Toast } from "@capacitor/toast";
import VLC from "../Plugins/VLC";

export interface AccountItemProps {
    account: IAccount;
    del: (url:string) => void;
}

export default function AccountItem({account, del } : AccountItemProps) {
    const { context, setContext } = useContext(AppContext);
    const navigate = useNavigate();
    const login = useCallback(async () => {
        const ret = await VLC.login({ username: account.username!, password: account.password, url: account.url });
        if (ret.status === "ok") {
            setContext(ret.value!);
            navigate("/home");
        }
        else {
            await Toast.show({ 
                text: ret.error
            });
        }
    }, []);

    const deleteAccount = useCallback(async () => {
        const ret = await VLC.deleteAccount({url: account.url});
        if(ret.status === "ok"){
            del(account.url);
        }
        else{
            Toast.show({text: ret.error});
        }
    }, [context, setContext]);

    return (
        <div className="account-item d-flex flex-row align-items-center justify-content-start">
            <div onClick={login} className="d-flex align-items-center justify-content-center text-white account-icon">
                <FontAwesomeIcon icon={faUser} size="2x" />
            </div>
            <div onClick={login} className="d-flex flex-column align-items-start justify-content-start ml-5 account-info">
                <span className="text-white">{account.username}</span>
                <span className="text-white no-wrap no-overflow">on {account.url}</span>
            </div>
            <div onClick={deleteAccount} className="d-flex flex-row align-items-center justify-content-center text-white delete">
                <i className="bi bi-trash" style={{ fontSize: "2rem" }}></i>
            </div>
        </div>)
}
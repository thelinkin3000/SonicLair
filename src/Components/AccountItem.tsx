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

export interface AccountItemProps {
    account: IAccount;
}

export default function AccountItem(props: AccountItemProps) {
    const { context, setContext } = useContext(AppContext);
    const navigate = useNavigate();
    const login = useCallback(async () => {
        const uuid = uuidv4();
        const hash = md5(`${props.account.password}${uuid}`);
        const basicParams: IBasicParams = {
            u: props.account.username!,
            t: hash,
            s: uuid,
            v: "1.16.1",
            c: "soniclair",
            f: "json"
        };
        try {
            const ret = await axios.get<{ "subsonic-response": ISubsonicResponse }>(`${props.account.url}/rest/getScanStatus`, { params: basicParams });
            if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
                const newContext: IAppContext = {
                    activeAccount: props.account,
                    accounts: context.accounts,
                    spotifyToken: context.spotifyToken,
                };
                setContext(newContext);
                localStorage.setItem('serverCreds', JSON.stringify(newContext));
                navigate("/home");
            }
            else {
                if (ret?.data["subsonic-response"]?.status === "failed")
                    await Toast.show({
                        text: ret?.data["subsonic-response"]?.error?.message!
                    });
            }
        }
        catch (e) {
            await Toast.show({
                text: "Ocurrió un error comunicándonos con el servidor"
            });
        }
    }, [context]);

    const deleteAccount = useCallback(() => {
        const newContext = {
            ...context,
            accounts: context.accounts.filter(s => s.url !== props.account.url)
        };
        setContext(newContext);
        localStorage.setItem("serverCreds",JSON.stringify(newContext));
    }, [context, setContext]);

    return (
        <div className="account-item d-flex flex-row align-items-center justify-content-start">
            <div onClick={login} className="d-flex align-items-center justify-content-center text-white account-icon">
                <FontAwesomeIcon icon={faUser} size="2x" />
            </div>
            <div onClick={login} className="d-flex flex-column align-items-start justify-content-start ml-5 account-info">
                <span className="text-white">{props.account.username}</span>
                <span className="text-white no-wrap no-overflow">on {props.account.url}</span>
            </div>
            <div onClick={deleteAccount} className="d-flex flex-row align-items-center justify-content-center text-white delete">
                <i className="bi bi-trash" style={{ fontSize: "2rem" }}></i>
            </div>
        </div>)
}
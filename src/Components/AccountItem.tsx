import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext } from "react";
import { AppContext } from "../AppContext";
import { IAccount } from "../Models/AppContext";
import "./AccountItem.scss";
import { useNavigate } from "react-router-dom";
import { Toast } from "@capacitor/toast";
import VLC from "../Plugins/VLC";
import classNames from "classnames";

export interface AccountItemProps {
    account: IAccount;
    del: (url: string) => void;
}

export default function AccountItem({ account, del }: AccountItemProps) {
    const { setContext } = useContext(AppContext);
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
    }, [account.password, account.url, account.username, navigate, setContext]);

    const deleteAccount = useCallback(async () => {
        const ret = await VLC.deleteAccount({ url: account.url });
        if (ret.status === "ok") {
            del(account.url);
        }
        else {
            Toast.show({ text: ret.error });
        }
    }, [account.url, del]);

    return (
        <div className={classNames("account-item", "d-flex", "flex-row", "align-items-center", "justify-content-start")}>
            <div onClick={login} className="d-flex align-items-center justify-content-center text-white account-icon">
                <FontAwesomeIcon icon={faUser} size="2x" />
            </div>
            <div onClick={login} className="d-flex flex-column align-items-start justify-content-start ml-5 account-info">
                <span className="text-white">{account.username}</span>
                <span className="text-white no-wrap no-overflow">on {account.url}</span>
            </div>
            <div onClick={deleteAccount} className={classNames("d-flex", "flex-row", "align-items-center", "justify-content-center", "text-white", "delete")}>
                <i className="bi bi-trash" style={{ fontSize: "2rem" }}></i>
            </div>
        </div>

    )
}
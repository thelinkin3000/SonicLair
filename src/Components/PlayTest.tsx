import { useForm } from "react-hook-form";
import { AppContext } from '../AppContext';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.svg';
import { motion, useAnimation } from 'framer-motion';
import { Toast } from '@capacitor/toast';
import AccountItem from './AccountItem';
import VLC from '../Plugins/VLC';
import { IAccount } from "../Models/AppContext";
import AndroidTVPlugin from "../Plugins/AndroidTV";
import { FocusContext, useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import classNames from "classnames";
import { QRCode } from 'react-qrcode-logo';


interface FormData {
    username: string;
    password: string;
    url: string;
}

export default function PlayTest() {
    const { context, setContext } = useContext(AppContext);
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<IAccount[]>([]);
    const [androidTv, setAndroidTv] = useState<boolean>(false);
    const [localIp, setLocalIp] = useState<string>("");
    const [showQr, setShowQr] = useState<boolean>(false);
    const controls = useAnimation();
    useEffect(() => {
        setTimeout(async () => {
            if (context.username !== "" && context.username !== null) {
                navigate("/home")
            }
            else if (context.username === null) {
                controls.start({ rotate: 0, scale: 1 });
                const ret = await VLC.getAccounts();
                if (ret.status === "ok") {
                    setAccounts(ret.value!);
                }
                else {
                    Toast.show({ text: ret.error });
                }
                const androidTv = (await AndroidTVPlugin.get()).value;
                setAndroidTv(androidTv);
                if (androidTv) {
                    setLocalIp((await AndroidTVPlugin.getIp()).value);
                }
            }
        }, 1000);
    }, [context]);

    useEffect(() => {
        AndroidTVPlugin.addListener("login", (info: any) => {
            hash(info);
        });
    }, []);

    const hash = async (data: FormData) => {
        const ret = await VLC.login(data);
        if (ret.status === "ok") {
            setContext(ret.value!);
            navigate("/home");
        }
        else {
            await Toast.show({
                text: ret.error
            });
        }
    }
    const { register, handleSubmit, formState: { errors }, setFocus } = useForm<FormData>();
    const onSubmit = handleSubmit(hash);

    const del = (url: string) => {
        setAccounts(accounts.filter(s => s.url !== url));
    }

    const { ref: usernameRef, focused: usernameFocused, focusSelf } = useFocusable();
    const { ref: passwordRef, focused: passwordFocused } = useFocusable();
    const { ref: urlRef, focused: urlFocused } = useFocusable();
    const { focusKey, ref: parentRef } = useFocusable();
    const { ref: buttonRef, focused: buttonFocused } = useFocusable({ onEnterPress: () => { onSubmit() } });
    const { ref: qrRef, focused: qrFocused } = useFocusable({ onEnterPress: () => { setShowQr(!showQr) } });
    useEffect(() => {
        if (usernameFocused) {
            setFocus("username");
        }
        if (passwordFocused) {
            setFocus("password");
        }
        if (urlFocused) {
            setFocus("url");
        }
        if (buttonFocused) {
            buttonRef.current.focus();
        }
        if (qrFocused) {
            qrRef.current.focus();
        }
    }, [usernameFocused, passwordFocused, urlFocused, buttonFocused, qrFocused]);

    useEffect(() => {
        setTimeout(() => {
            focusSelf();
        }, 500);

    }, [])

    return (
        <FocusContext.Provider value={focusKey}>
            <div className={classNames(showQr ? "d-flex" : "d-none", "soniclair-modal", "flex-column", "align-items-center", "justify-content-center")} style={{ width: "80vw", height: "80vh", top: "10vh", left: "10vw", position: "absolute" }}>
                <div className="p-5 d-flex align-items-center justify-content-around" style={{ backgroundColor: "white" }}>
                    <QRCode value={localIp}></QRCode>
                </div>
                    <span className="text-white">{localIp}</span>
            </div>
            <div ref={parentRef} className={"row d-flex align-items-center"} style={androidTv ? { height: "100%", width: "100vw" } : { height: "100vh" }}>
                <form onSubmit={onSubmit}>
                    <motion.div
                        className="container"
                        initial={{ scale: 0, y: 125 }}
                        animate={{ rotate: 0, scale: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 20
                        }}>
                        <div className="col-12 mb-3">
                            <img src={logo} className="App-logo" alt="logo" />
                            <p className="text-white logo-text">
                                SonicLair
                            </p>
                        </div>
                    </motion.div>
                    <motion.div
                        className="container"
                        initial={{ scale: 0 }}
                        animate={controls}
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 20
                        }}>
                        <div ref={usernameRef} className={"col-12 mb-3"}>
                            <input {...register("username", { required: true })} className={"form-control"} placeholder={"Username"} />
                        </div>
                        {errors && errors.username && <div className="col-12 text-danger">{errors.username.message}</div>}
                        <div ref={passwordRef} className={"col-12 mb-3"}>
                            <input {...register("password", { required: true })} type={"password"} className={"form-control"} placeholder={"Password"} />
                        </div>
                        {errors && errors.password && <div className="col-12 text-danger">{errors.password.message}</div>}
                        <div ref={urlRef} className={"col-12 mb-3"}>
                            <input {...register("url", { required: true })} className={"form-control"} placeholder={"Server URL"} />
                        </div>
                        {errors && errors.url && <div className="col-12 text-danger">{errors.url.message}</div>}

                        <button ref={buttonRef} type="submit" className={classNames("btn", buttonFocused ? "btn-selected" : "btn-primary", "mb-3")}>Log In!</button>
                        
                        {androidTv &&
                            <button ref={qrRef} type="button" onClick={() => { setShowQr(!showQr) }} className={classNames("btn", qrFocused ? "btn-selected" : "btn-primary", "mb-3")}>Display QR</button>}


                        {accounts.length > 0 && <div className="d-flex flex-column align-items-center justify-content-center">
                            {accounts.map(s => (<AccountItem account={s} del={del} />))}
                        </div>}
                    </motion.div>
                </form>
            </div>
        </FocusContext.Provider>
    )
}
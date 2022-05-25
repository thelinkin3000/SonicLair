import { v4 as uuidv4 } from 'uuid';
import md5 from 'js-md5';
import { useForm } from "react-hook-form";
import axios from 'axios';
import { AppContext } from '../AppContext';
import { useContext, useEffect, useState } from 'react';
import { IBasicParams } from '../Models/API/Requests/BasicParams';
import { ISubsonicResponse } from '../Models/API/Responses/SubsonicResponse';
import { useNavigate } from 'react-router-dom';
import logo from '../logo.svg';
import { motion, useAnimation } from 'framer-motion';
import { Toast } from '@capacitor/toast';
import AccountItem from './AccountItem';
import { IAppContext } from '../Models/AppContext';


interface FormData {
    username: string;
    password: string;
    url: string;
}

function removeTrailingSlash(str: string) {
    return str.replace(/\/+$/, '');
}


export default function PlayTest() {
    const { context, setContext } = useContext(AppContext);
    const navigate = useNavigate();
    const [error, setError] = useState<string>("");
    const controls = useAnimation();
    useEffect(() => {

        setTimeout(() => {
            if (context.activeAccount.username !== "" && context.activeAccount.username !== null) {
                navigate("/home")
            }
            else if (context.activeAccount.username === null) {
                controls.start({ rotate: 0, scale: 1 });
            }
        }, 1000);
    }, [context]);

    const hash = async (data: FormData) => {
        setError("handling");
        const uuid = uuidv4();
        const hash = md5(`${data.password}${uuid}`);
        const basicParams: IBasicParams = {
            u: data.username,
            t: hash,
            s: uuid,
            v: "1.16.1",
            c: "soniclair",
            f: "json"
        };
        try {
            const ret = await axios.get<{ "subsonic-response": ISubsonicResponse }>(`${data.url}/rest/getArtists`, { params: basicParams });
            if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
                const creds = {
                    username: data.username,
                    password: data.password,
                    url: removeTrailingSlash(data.url),
                    type: ret.data['subsonic-response'].type,
                };
                if (context.accounts.filter(s => s.url === data.url).length === 1) {
                    const newContext: IAppContext = {
                        activeAccount: creds,
                        accounts: [
                            ...context.accounts.filter(s => s.url !== data.url),
                            creds],
                        spotifyToken: context.spotifyToken,

                    };
                    setContext(newContext);
                    localStorage.setItem('serverCreds', JSON.stringify(newContext));
                }
                else {
                    const newContext: IAppContext = {
                        activeAccount: creds,
                        accounts: [
                            ...context.accounts,
                            creds],
                        spotifyToken: context.spotifyToken
                    };
                    setContext(newContext);
                    localStorage.setItem('serverCreds', JSON.stringify(newContext));
                }
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

    }
    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
    const onSubmit = handleSubmit(hash);

    return (
        <div className={"row d-flex align-items-center"} style={{ height: "100vh" }}>
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
                    <div className={"col-12 mb-3"}>
                        <input {...register("username", { required: true })} className={"form-control"} placeholder={"Username"} />
                    </div>
                    {errors && errors.username && <div className="col-12 text-danger">{errors.username.message}</div>}
                    <div className={"col-12 mb-3"}>
                        <input {...register("password", { required: true })} type={"password"} className={"form-control"} placeholder={"Password"} />
                    </div>
                    {errors && errors.password && <div className="col-12 text-danger">{errors.password.message}</div>}
                    <div className={"col-12 mb-3"}>
                        <input {...register("url", { required: true })} className={"form-control"} placeholder={"Server URL"} />
                    </div>
                    {errors && errors.url && <div className="col-12 text-danger">{errors.url.message}</div>}

                    <button type="submit" className={"btn btn-primary mb-3"}>Log In!</button>
                    {context.accounts.length > 0 && <div className="d-flex flex-column align-items-center justify-content-center">
                        {context.accounts.map(s => (<AccountItem account={s} />))}
                    </div>}
                </motion.div>
            </form>
        </div>
    )
}
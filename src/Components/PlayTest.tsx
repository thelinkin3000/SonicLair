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
import VLC from '../Plugins/VLC';


interface FormData {
    username: string;
    password: string;
    url: string;
}

export default function PlayTest() {
    const { context, setContext } = useContext(AppContext);
    const navigate = useNavigate();
    const [error, setError] = useState<string>("");
    const controls = useAnimation();
    useEffect(() => {
        setTimeout(() => {
            if (context.username !== "" && context.username !== null) {
                navigate("/home")
            }
            else if (context.username === null) {
                controls.start({ rotate: 0, scale: 1 });
            }
        }, 1000);
    }, [context]);

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
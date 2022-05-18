import { v4 as uuidv4 } from 'uuid';
import md5 from 'js-md5';
import { useForm } from "react-hook-form";
import axios from 'axios';
import { AppContext } from '../AppContext';
import { useContext, useEffect, useState } from 'react';
import { IBasicParams } from '../Models/API/Requests/BasicParams';
import { ISubsonicResponse } from '../Models/API/Responses/SubsonicResponse';
import { useNavigate } from 'react-router-dom';

interface FormData {
    username: string;
    password: string;
    url: string;
}

export default function PlayTest() {
    const { context, setContext } = useContext(AppContext);
    const navigate = useNavigate();
    const [error, setError] = useState<string>("");
    useEffect(() => {
        if (context.url.length > 0) {
            navigate("/artists");
        }

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
        const ret = await axios.get<{ "subsonic-response": ISubsonicResponse }>(`${data.url}/rest/getArtists`, { params: basicParams });
        if (ret?.status === 200 && ret?.data["subsonic-response"]?.status === "ok") {
            setError("handled");
            console.log(ret.data);
            const creds = { username: data.username, password: data.password, url: data.url };
            setContext(creds);
            localStorage.setItem('serverCreds', JSON.stringify(creds));
            navigate("/artists");
        }
        else {
            setError("errored");
        }
    }
    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
    const onSubmit = handleSubmit(hash);

    return (
        <div className={"row "}>
            <form onSubmit={onSubmit}>
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

                <button type="submit" className={"btn btn-primary"}>ClickMe!</button>
                <span className="text-primary">{error}</span>
            </form>
        </div>
    )
}
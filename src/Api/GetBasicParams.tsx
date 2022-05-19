import { IAppContext } from "../Models/AppContext";
import { v4 as uuidv4 } from 'uuid';
import md5 from "js-md5";
import { IBasicParams } from "../Models/API/Requests/BasicParams";

export default function GetBasicParams(context:IAppContext) : IBasicParams {
    // const uuid = uuidv4();
    const uuid = "abclknasd";
    const hash = md5(`${context.password}${uuid}`);
    const basicParams : IBasicParams = {
        u: context.username,
        t: hash,
        s: uuid,
        v: "1.16.1",
        c: "soniclair",
        f: "json"
    };
    return basicParams;
}


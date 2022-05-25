export interface ISubsonicResponse{
    serverVersion:string;
    status:string;
    type:string;
    version:string;
    error?:{
        message:string,
        code: number,
    };
}
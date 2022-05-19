export function GetAsParams(data:any):string{
    return new URLSearchParams(data).toString();
}

export function SecondsToHHSS(data:number){
    try{
        return new Date(data * 1000).toISOString().substr(14, 5);

    }
    catch{
        return "00:00";
    }

}
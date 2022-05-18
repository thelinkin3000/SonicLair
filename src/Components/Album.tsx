import { useContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { isTemplateExpression } from "typescript";
import GetAlbum from "../Api/GetAlbum";
import GetArtist from "../Api/GetArtist";
import GetArtistInfo from "../Api/GetArtistInfo";
import GetBasicParams from "../Api/GetBasicParams";
import { AppContext } from "../AppContext";
import { GetAsParams } from "../Helpers";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import { IAlbumResponse, IArtistResponse } from "../Models/API/Responses/IArtistResponse";
import AlbumCard from "./AlbumCard";
import "./Album.scss";
import SongItem from "./SongItem";


export default function Album() {
    const [album, setAlbum] = useState<IAlbumResponse>();
    const [albumInfo, setAlbumInfo] = useState<IArtistInfoResponse>();
    const [albumFetched, setAlbumFetched] = useState<boolean>();
    const [albumInfoFetched, setAlbumInfoFetched] = useState<boolean>();
    const { context } = useContext(AppContext);
    const { state }: any = useLocation();
    const getCoverArtParams = () => {
        return GetAsParams({ ...GetBasicParams(context), id: state.id });
    };
    useEffect(() => {
        const fetch = async () => {
            if (state.id === 0 || !state.id) {
                setAlbumFetched(true);
                return;
            }
            const ret = await GetAlbum(context, state.id);

            setAlbum(ret);
        }
        if (!albumFetched && context.url !== "") {
            fetch();
        }

    }, [albumFetched, context]);
    useEffect(() => {
        const fetch = async () => {
            if (state.id === 0 || !state.id) {
                setAlbumInfoFetched(true);
                return;
            }
            const ret = await GetArtistInfo(context, state.id);

            setAlbumInfo(ret);
        }
        if (!albumInfoFetched && context.url !== "") {
            fetch();
        }

    }, [albumFetched, context]);
    return (<>
        <div className="album-header d-flex flex-row align-items-center justify-content-start">
            <img className={"album-img"} src={`${context.url}/rest/getCoverArt?${getCoverArtParams()}`}></img>
            <div className="ml-2 h-100 d-flex flex-column align-items-start justify-content-end">
                <span style={{ color: "white" }}>{album?.album.name}</span>
                <span style={{ color: "white" }}>by {album?.album.artist}</span>
            </div>
        </div>
        <div className="scrollable" style={{ height: "60vh", overflow: "auto" }}>
            <div className="list-group" >
                {album && album?.album.song.map(s => <SongItem item={s} album={album.album.song}/>)}
            </div>
        </div>
    </>
    )
}
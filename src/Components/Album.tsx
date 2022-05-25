import { useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import GetAlbum from "../Api/GetAlbum";
import GetBasicParams from "../Api/GetBasicParams";
import { AppContext } from "../AppContext";
import { GetAsParams, SecondsToHHSS } from "../Helpers";
import { IAlbumResponse } from "../Models/API/Responses/IArtistResponse";
import "./Album.scss";
import SongItem from "./SongItem";
import Loading from "./Loading";
import { Helmet } from "react-helmet";

export default function Album() {
    const [album, setAlbum] = useState<IAlbumResponse>();
    const [albumFetched, setAlbumFetched] = useState<boolean>();
    const { context } = useContext(AppContext);
    const { state }: any = useLocation();
    const [imgDimentions, setImgDimentions] = useState<any>();
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
            setAlbumFetched(true);
            setAlbum(ret);
        }
        fetch();

    }, [albumFetched, context, state]);

    const onLoadImage = useCallback((ev: any) => {
        if (ev.target.height >= ev.target.width) {
            setImgDimentions({
                height: "20vh",
                width: "auto"
            });
        }
        else {
            setImgDimentions({
                height: "auto",
                maxWidth: "20vh",
            });
        }
    }, []);
    if (!albumFetched) {
        return (<div className="row">
            <div className="col-12 d-flex align-items-center justify-content-center" style={{ height: "100%" }}>
                <Loading />
            </div>
        </div>);
    }
    return (<>
        <Helmet>
            <title>{album?.album.name} - SonicLair</title>
        </Helmet>
        <div className="album-header d-flex flex-row align-items-center justify-content-start">
            <img className="album-img" src={`${context.activeAccount.url}/rest/getCoverArt?${getCoverArtParams()}`} style={{ ...imgDimentions }} onLoad={onLoadImage}></img>

            <div className="ml-2 mb-2 h-100 flex-column align-items-start justify-content-end hide-desktop-flex">
                <span className="text-white text-start text-header-mobile">{album?.album.name}</span>
                <span className="text-white text-start">by {album?.album.artist}</span>
            </div>
            <div className="ml-2 h-100 flex-column align-items-start justify-content-between hide-mobile-flex">
                <span className="text-white text-start text-header">{album?.album.name}</span>
                <div className="d-flex flex-column align-items-start justify-content-end">
                    <span className="text-white text-start">by {album?.album.artist}</span>
                    <span className="text-white text-start">{SecondsToHHSS(album?.album.duration ?? 0)}</span>
                    <span className="text-white text-start">{album?.album.songCount} songs</span>
                    <span className="text-white text-start">released on {album?.album.year}</span>
                </div>
            </div>
        </div>
        <div className="scrollable" style={{ height: "100%", overflow: "auto" }}>
            <div className="list-group" >
                {album && album?.album.song.map(s => <SongItem item={s} album={album.album.song} />)}
            </div>
        </div>
    </>
    )
}
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation, useParams } from "react-router-dom";
import { isTemplateExpression } from "typescript";
import GetArtist from "../Api/GetArtist";
import GetArtistInfo from "../Api/GetArtistInfo";
import GetBasicParams from "../Api/GetBasicParams";
import { AppContext } from "../AppContext";
import { GetAsParams } from "../Helpers";
import useWindowSize from "../Hooks/useWindowSize";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import { IAlbumArtistResponse, IArtistResponse } from "../Models/API/Responses/IArtistResponse";
import AlbumCard from "./AlbumCard";
import "./Artist.scss";
import Loading from "./Loading";


export default function Artist() {
    const [artist, setArtist] = useState<IArtistResponse>();
    const [artistInfo, setArtistInfo] = useState<IArtistInfoResponse>();
    const [artistFetched, setArtistFetched] = useState<boolean>();
    const [artistInfoFetched, setArtistInfoFetched] = useState<boolean>();
    const [imgDimentions, setImgDimentions] = useState<any>({});
    const { context } = useContext(AppContext);
    const { state }: any = useLocation();
    const [width, height] = useWindowSize();
    const img = useRef(new Image());

    const getCoverArtParams = () => {
        return GetAsParams({ ...GetBasicParams(context), id: state.id });
    };
    useEffect(() => {
        const fetch = async () => {
            if (state.id === 0 || !state.id) {
                setArtistFetched(true);
                return;
            }
            const ret = await GetArtist(context, state.id);

            setArtist(ret);
            setArtistFetched(true);
        }
        if (!artistFetched && context.url !== "") {
            fetch();
        }

    }, [artistFetched, context]);
    useEffect(() => {
        const fetch = async () => {
            if (state.id === 0 || !state.id) {
                setArtistInfoFetched(true);
                return;
            }
            const ret = await GetArtistInfo(context, state.id);

            setArtistInfo(ret);
            setArtistInfoFetched(true);
        }
        if (!artistInfoFetched && context.url !== "") {
            fetch();
        }

    }, [artistFetched, context]);

    const onLoadImage = useCallback((ev: any) => {
        if (ev.target.height >= ev.target.width || width > ev.target.width) {
            setImgDimentions({
                height: "auto",
                width: "100%"
            });
        }
        else {
            setImgDimentions({
                height: "100%",
                width: "auto"
            });
        }
    }, [height, width]);

    useEffect(() => {
        if (!img.current)
            return;
        if (img.current.height >= img.current.width || width > img.current.width) {
            setImgDimentions({
                height: "auto",
                width: "100%"
            });
        }
        else {
            setImgDimentions({
                height: "100%",
                width: "auto"
            });
        }

    }, [width, height]);
    if(!artist){

        return(<div className="row">
        <div className="col-12 d-flex align-items-center justify-content-center" style={{height:"80vh"}}>
            <Loading />
        </div>
    </div>);
    }

    return (<>
        <Helmet>
            <title>{artist.artist.name} - SonicLair</title>
        </Helmet>
        <div className="artist-container d-flex flex-column">
            {artistInfo && (
                <>
                    <img className="artist-img" src={artistInfo.artistInfo.largeImageUrl} onLoad={onLoadImage} style={{ ...imgDimentions }} ref={img} />
                <div className="artist-image-container">
                </div>
                </>
            )}
            <div className="text-white d-flex flex-column align-items-start justify-content-end artist-name-container">{artist && artist.artist.name}</div>
            <div className="scrollable" style={{ width: "100%", overflow: "auto" }}>
                <div className="grid-list" >
                    {artist && artist?.artist.album.map(s => <AlbumCard item={s} key={s.id} />)}
                </div>
            </div>
            
        </div>
    </>
    )
}
import { useContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { isTemplateExpression } from "typescript";
import GetArtist from "../Api/GetArtist";
import GetArtistInfo from "../Api/GetArtistInfo";
import GetBasicParams from "../Api/GetBasicParams";
import { AppContext } from "../AppContext";
import { GetAsParams } from "../Helpers";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import { IArtistResponse } from "../Models/API/Responses/IArtistResponse";
import AlbumCard from "./AlbumCard";
import "./Artist.scss";


export default function Artist() {
    const [artist, setArtist] = useState<IArtistResponse>();
    const [artistInfo, setArtistInfo] = useState<IArtistInfoResponse>();
    const [artistFetched, setArtistFetched] = useState<boolean>();
    const [artistInfoFetched, setArtistInfoFetched] = useState<boolean>();
    const { context } = useContext(AppContext);
    const { state }: any = useLocation();
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
        }
        if (!artistInfoFetched && context.url !== "") {
            fetch();
        }

    }, [artistFetched, context]);
    return (<>
        <div className="artist-container d-flex flex-column" >
            {artistInfo && (<img className="artist-img" src={artistInfo.artistInfo.largeImageUrl}></img>)}
            <div className="text-white d-flex flex-column align-items-start justify-content-end artist-name-container">{artist && artist.artist.name}</div>
            <div className="scrollable" style={{ width:"100%",overflow: "auto" }}>
                <div className="grid-list" >
                    {artist && artist?.artist.album.map(s => <AlbumCard item={s} />)}
                </div>
            </div>
        </div>
    </>
    )
}
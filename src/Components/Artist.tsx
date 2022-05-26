import { floor } from "lodash";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { FixedSizeGrid as Grid } from "react-window";
import { GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import GetArtist from "../Api/GetArtist";
import GetArtistInfo from "../Api/GetArtistInfo";
import GetBasicParams from "../Api/GetBasicParams";
import GetSpotifyArtist from "../Api/GetSpotifyArtist";
import { AppContext } from "../AppContext";
import { GetAsParams } from "../Helpers";
import useWindowSize from "../Hooks/useWindowSize";
import { IArtistInfoResponse } from "../Models/API/Responses/IArtistInfoResponse";
import { IAlbumArtistResponse, IArtistResponse } from "../Models/API/Responses/IArtistResponse";
import AlbumCard from "./AlbumCard";
import "./Artist.scss";
import Loading from "./Loading";
import useAutoFill from "../Hooks/useAutoFill";


export default function Artist() {
    const [artist, setArtist] = useState<IArtistResponse>();
    const [coverArt, setCoverArt] = useState<string>("");
    const [artistFetched, setArtistFetched] = useState<boolean>();
    const [artistInfoFetched, setArtistInfoFetched] = useState<boolean>();
    const [imgDimentions, setImgDimentions] = useState<any>({});
    const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
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
            setAlbums(ret.artist.album);
            console.log(ret.artist.album);
            setArtistFetched(true);
        }
        if (!artistFetched && context.activeAccount.url !== "") {
            fetch();
        }

    }, [artistFetched, context]);
    useEffect(() => {
        const fetch = async () => {
            if (state.id === 0 || !state.id) {
                setArtistInfoFetched(true);
                return;
            }
            try {
                const items = await GetSpotifyArtist(context.spotifyToken, artist!.artist.name);
                if (items.length > 0 && items[0].name === artist!.artist.name) {
                    if (items[0].images.length > 1) {
                        setCoverArt(items[0].images[1].url);
                    }
                    else {
                        setCoverArt(items[0].images[0].url);

                    }
                }
                else {
                    const ret = await GetArtistInfo(context, artist!.artist.id);
                    setCoverArt(ret.artistInfo2.largeImageUrl);
                }
            }
            catch (e) {
            }
            setArtistInfoFetched(true);

        }
        if (!artistInfoFetched && artistFetched && artist !== undefined && context.activeAccount.url !== "" && context.spotifyToken !== "") {
            fetch();
        }

    }, [artistFetched, artistInfoFetched, artist, context]);

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

    const { width: listWidth, height: listHeight, columnWidth, gridProps, autoFillRef, columnCount } = useAutoFill(albums);

    const AlbumCardWrapper = useCallback(({ data, style, columnIndex, rowIndex }: GridChildComponentProps<IAlbumArtistResponse[]>) => {
        const index = rowIndex * columnCount + columnIndex;
        if (data[index] === undefined) {
            return (<div style={{ ...style }}>

            </div>);
        }
        return (<div style={{ ...style }}>
            <AlbumCard key={`albumcard-${index}`} item={data[index]} forceWidth={false} />
        </div>
        )
    }, [columnCount]);

    if (!artist) {

        return (<div className="row">
            <div className="col-12 d-flex align-items-center justify-content-center" style={{ height: "100%" }}>
                <Loading />
            </div>
        </div>);
    }

    return (<>
        <Helmet>
            <title>{artist.artist.name} - SonicLair</title>
        </Helmet>
        <div className="artist-container d-flex flex-column">
            {coverArt !== "" && (
                <>
                    <img className="artist-img" src={coverArt} onLoad={onLoadImage} style={{ ...imgDimentions }} ref={img} />
                    <div className="artist-image-container">
                    </div>
                </>
            )}
            <div className="text-white d-flex flex-column align-items-start justify-content-end artist-name-container">
                {artist && artist.artist.name}
            </div>
            <div ref={autoFillRef} style={{ height: "100%", width: "100%" }}>
                <Grid
                    {...gridProps}
                    itemData={albums}
                >
                    {AlbumCardWrapper}
                </Grid>
            </div>

        </div>
    </>
    )
}
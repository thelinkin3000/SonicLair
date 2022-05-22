import React, { useEffect, useState } from "react";
import { IArtist } from "../Models/API/Responses/IArtist";
import "./AlbumCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import { IAlbumArtistResponse } from "../Models/API/Responses/IArtistResponse";
import { GetAsParams } from "../Helpers";
import GetBasicParams from "../Api/GetBasicParams";
import { useCallback, useContext, useRef } from "react";
import { AppContext } from "../AppContext";
import useVisible from "../Hooks/useVisible";
import Loading from "./Loading";
export default function AlbumCard({ item }: { item: IAlbumArtistResponse }) {
    const navigate = useNavigate();
    const { context } = useContext(AppContext);
    const getCoverArtParams = useCallback(() => {
        return GetAsParams({ ...GetBasicParams(context), id: item.id });
    }, [context]);

    const ref = useRef<HTMLDivElement>(null);


    return (
        <div ref={ref} className="list-group-item d-flex flex-column align-items-center justify-content-between album-item"
            onClick={() => navigate(`/album`, { state: { id: item.id } })}>
            <div className="d-flex align-items-center justify-content-center album-image-container">
                <img src={`${context.url}/rest/getCoverArt?${getCoverArtParams()}`} className="album-image"></img>
            </div>
            <div className=" d-flex flex-column align-items-start justify-content-end text-white no-overflow">
                <span>
                    {item.name}
                </span>
                <span>
                    {item.year}
                </span>
            </div>

        </div>
    )
}
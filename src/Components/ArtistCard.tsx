import { IArtist } from "../Models/API/Responses/IArtist";
import "./ArtistCard.scss";
import "../Styles/colors.scss";
import { useNavigate } from "react-router-dom";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { AppContext, StateContext } from "../AppContext";
import Loading from "./Loading";
import VLC from "../Plugins/VLC";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import classNames from "classnames";

interface ArtistCardProps {
    item: IArtist;
    forceWidth?: boolean;
    parentRef?: React.RefObject<any>;
    columnIndex?: number;
    rowIndex?: number;
}

export default function ArtistCard({
    item,
    forceWidth,
    parentRef,
    columnIndex,
    rowIndex,
}: ArtistCardProps) {
    const navigate = useNavigate();
    const { context } = useContext(AppContext);
    const [coverArt, setCoverArt] = useState<string>("");
    const [style, setStyle] = useState<any>({});
    const { stateContext, setStateContext } = useContext(StateContext);

    useEffect(() => {
        const fetch = async () => {
            const ret = await VLC.getArtistArt({ id: item.id });
            if (ret.status === "ok") {
                setCoverArt(ret.value!);
            }
        };
        const handler = setTimeout(fetch, 500);
        return () => {
            clearTimeout(handler);
        };
    }, [context, item]);

    const onload = (ev: any) => {
        if (
            ev.target.height > ev.target.width &&
            ev.target.height > ref.current!.clientWidth - 10
        ) {
            setStyle({
                width: "auto",
                height: `${ref.current!.clientWidth - 10}px`,
            });
        }
    };

    const { focused, ref } = useFocusable();
    useEffect(() => {
        if (focused) {
            parentRef?.current.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
            });
            ref.current.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
            });
        }
    }, [focused, parentRef, ref]);

    const nav = useCallback(() => {
        if (columnIndex !== undefined && rowIndex !== undefined) {
            setStateContext({
                ...stateContext,
                selectedArtist: [rowIndex, columnIndex],
            });
        }
        navigate(`/artist`, { state: { id: item.id } });
    }, [
        columnIndex,
        rowIndex,
        navigate,
        item.id,
        setStateContext,
        stateContext,
    ]);
    return (
        <div
            ref={ref}
            style={{ width: forceWidth ? "170px" : "" }}
            className={classNames(
                "d-flex",
                "flex-column",
                "align-items-center",
                "justify-content-between",
                "artist-item",
                "not-selectable",
                focused ? "artist-item-focused" : ""
            )}
            onClick={nav}
        >
            <div className="d-flex align-items-center justify-content-center artist-image-container">
                {coverArt !== "" ? (
                    <img
                        alt=""
                        style={style}
                        src={coverArt}
                        onLoad={onload}
                        className="artist-image"
                    ></img>
                ) : (
                    <Loading />
                )}
            </div>
            <div className="w-100 d-flex flex-column align-items-start justify-content-end text-white no-overflow">
                <span>{item.name}</span>
                <span>
                    {item.albumCount} {item.albumCount > 1 ? "albums" : "album"}
                </span>
            </div>
        </div>
    );
}

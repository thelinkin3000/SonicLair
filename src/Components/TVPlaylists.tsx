import { useCallback, useEffect, useState } from "react";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import useAutoFill from "../Hooks/useAutoFill";
import { IPlaylist } from "../Models/API/Responses/IPlaylistsResponse";
import VLC from "../Plugins/VLC";
import { PlaylistItem } from "./PlaylistItem";
import PlaylistItemCard from "./PlaylistItemCard";

export default function TVPlaylists() {
    const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
    const [currentPlaylist, setCurrentPlaylist] = useState<IPlaylist>();
    const fetch = useCallback(async () => {
        const ret = await VLC.getPlaylists();
        const current = await VLC.getCurrentPlaylist();
        if(current.status === "ok"){
            setCurrentPlaylist(current.value!!);
        }
        if (ret.status === "ok") {
            setPlaylists([...ret.value!!]);
        }
    }, []);
    useEffect(() => {
        if (playlists.length === 0) {
            fetch();
        }
    }, [fetch, playlists]);

    const { gridProps, autoFillRef, columnCount } = useAutoFill(playlists);


    const AlbumCardWrapper = useCallback(
        ({
            data,
            style,
            columnIndex,
            rowIndex,
        }: GridChildComponentProps<IPlaylist[]>) => {
            const index = rowIndex * columnCount + columnIndex;
            if (data[index] === undefined) {
                return <></>;
            }
            return (
                <div
                    style={{ ...style }}
                    key={`${rowIndex},${columnIndex}`}
                    id={`${rowIndex},${columnIndex}`}
                    className="d-flex flex-column align-items-center justify-content-center"

                >
                    <PlaylistItemCard item={data[index]} key={index} />
                </div>
            );
        },
        [columnCount]
    );
    return (
        <div className="d-flex flex-column w-100 h-100 align-items-start playlist-container">
            {currentPlaylist && (
                <div className="d-flex flex-row w-100">

                    <div className="list-group w-100">
                        <PlaylistItem item={currentPlaylist} playing={true} />
                    </div>
                </div>
            )}
            {playlists.length > 1 && (
                <>
                    <div className="section-header text-white mt-3">
                        Playlists
                    </div>
                    <div
                    ref={autoFillRef}
                    style={{ height: "100%", width: "100%" }}
                >
                    <Grid
                        {...gridProps}
                        useIsScrolling={true}
                        style={{ overflowY: "auto", overflowX: "hidden" }}
                        itemData={playlists}
                    >
                        {AlbumCardWrapper}
                    </Grid>
                </div>
                </>
            )}
        </div>
    );
}

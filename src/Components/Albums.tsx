import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { floor } from "lodash";
import { SyntheticEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import GetAlbums from "../Api/GetAlbums";
import GetArtists from "../Api/GetAlbums";
import { AppContext } from "../AppContext";
import { IArtist } from "../Models/API/Responses/IArtist";
import { IAlbumArtistResponse, IAlbumResponse } from "../Models/API/Responses/IArtistResponse";
import AlbumCard from "./AlbumCard";
import ArtistCard from "./ArtistCard";
import "./Artists.scss";
import Loading from "./Loading";

export default function Albums() {
    const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
    const [filteredAlbums, setFilteredAlbums] = useState<IAlbumArtistResponse[]>([]);
    const [fetched, setFetched] = useState<boolean>(false);
    const { context } = useContext(AppContext);
    const [canSearch, setCanSearch] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetch = async () => {
            const al = (await GetAlbums(context));
            console.log(al);
            setAlbums(al.albumList2.album);
            setFilteredAlbums(al.albumList2.album);
            setFetched(true);
        }
        if (!fetched) {
            fetch();
        }
    }, [fetched]);

    const search = (val: any) => {
        if (val.target.value.length === 0)
            setFilteredAlbums(albums);
        setFilteredAlbums(albums.filter(s => s.name.toUpperCase().indexOf(val.target.value.toUpperCase()) !== -1));
    }

    useEffect(() => {
        if (canSearch) {
            searchRef.current!.focus();

        }
    }, [canSearch]);




    const toggleSearch = () => {
        setCanSearch(!canSearch);

    }

    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [columnWidth, setColumnWidth] = useState<number>(190);

    const AlbumCardWrapper = useCallback(({ data, style, columnIndex, rowIndex }: GridChildComponentProps<IAlbumArtistResponse[]>) => {
        const index = rowIndex * floor(width / columnWidth) + columnIndex;
        console.log("item", index);
        if (data[index] === undefined) {
            return (<></>);
        }
        return (<div style={{...style}}>
            <AlbumCard item={data[index]} />
        </div>
        )
    }, [width, columnWidth]);

    if (albums.length === 0) {
        return (<div className="row" style={{ height: "100%" }}>
            <div className="col-12 d-flex align-items-center justify-content-center" style={{ height: "100%" }}>
                <Loading />
            </div>
        </div>);
    }


    return (<>
        <div className="artist-container d-flex flex-column">
            <div className="d-flex flex-row align-items-center justify-content-between w-100">
                <div className="section-header text-white">Albums</div>
                <button type="button" className="btn btn-link text-white" onClick={toggleSearch}>
                    <FontAwesomeIcon icon={faMagnifyingGlass}></FontAwesomeIcon>
                </button>
            </div>
            <input ref={searchRef} className={classNames("form-control", "mb-2", canSearch ? "" : "d-none")} placeholder="Search..." onKeyUp={search} />

            <AutoSizer>
                {({ width, height }) => {
                    setWidth(width);
                    setHeight(height);
                    const columns = floor(width / 190);
                    const w = 190 + (width%190/columns);
                    setColumnWidth(w);
                    return (
                        <Grid
                            columnCount={width / w}
                            columnWidth={w}
                            height={height}
                            rowCount={filteredAlbums.length / floor(width / w)}
                            rowHeight={260}
                            width={width}
                            className={"scrollable"}
                            itemData={filteredAlbums}
                        >
                            {AlbumCardWrapper}
                        </Grid>
                    )
                }}
            </AutoSizer>
        </div>
    </>

    )
}
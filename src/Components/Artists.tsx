import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React, { SyntheticEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import GetArtists from "../Api/GetArtists";
import { AppContext } from "../AppContext";
import { IArtist } from "../Models/API/Responses/IArtist";
import ArtistCard from "./ArtistCard";
import "./Artists.scss";
import Loading from "./Loading";
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid, FixedSizeGridProps, GridChildComponentProps } from 'react-window';
import { floor } from "lodash";

export default function Artists() {
    const [artists, setArtists] = useState<IArtist[]>([]);
    const [filteredArtists, setFilteredArtists] = useState<IArtist[]>([]);
    const [fetched, setFetched] = useState<boolean>(false);
    const { context } = useContext(AppContext);
    const [canSearch, setCanSearch] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetch = async () => {
            const ar = (await GetArtists(context));
            console.log(ar);
            const ret = ar.artists.index.reduce<IArtist[]>((previous, s) => { return [...previous, ...(s.artist)] }, []);
            setArtists(ret);
            setFilteredArtists(ret);
            setFetched(true);
        }
        if (!fetched) {
            fetch();
        }
    }, [fetched]);

    const search = (val: any) => {
        if (val.target.value.length === 0)
            setFilteredArtists(artists);
        setFilteredArtists(artists.filter(s => s.name.toUpperCase().indexOf(val.target.value.toUpperCase()) !== -1));
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

    const ArtistCardWrapper = useCallback(({ data, style, columnIndex, rowIndex }: GridChildComponentProps<IArtist[]>) => {
        const index = rowIndex * floor(width / columnWidth) + columnIndex;
        console.log("item", index);
        if (data[index] === undefined) {
            return (<></>);
        }
        return (<div style={{...style}}>
            <ArtistCard item={data[index]} />
        </div>
        )
    }, [width, columnWidth]);

    if (artists.length === 0) {
        return (<div className="row">
            <div className="col-12 d-flex align-items-center justify-content-center" style={{ height: "100%" }}>
                <Loading />
            </div>
        </div>);
    }
    return (<>
        <div className=" artist-list-container d-flex flex-column">
            <div className="d-flex flex-row align-items-center justify-content-between w-100">
                <div className="section-header text-white">Artists</div>
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
                            rowCount={filteredArtists.length / floor(width / w)}
                            rowHeight={260}
                            width={width}
                            className={"scrollable"}
                            itemData={filteredArtists}
                        >
                            {ArtistCardWrapper}
                        </Grid>
                    )
                }}
            </AutoSizer>
        </div>
    </>

    )
}



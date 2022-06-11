import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import { StateContext } from "../AppContext";
import { IAlbumArtistResponse } from "../Models/API/Responses/IArtistResponse";
import AlbumCard from "./AlbumCard";
import "./Artists.scss";
import Loading from "./Loading";
import useAutoFill from "../Hooks/useAutoFill";
import VLC from "../Plugins/VLC";

export default function Albums() {
    const [albums, setAlbums] = useState<IAlbumArtistResponse[]>([]);
    const [filteredAlbums, setFilteredAlbums] = useState<IAlbumArtistResponse[]>([]);
    const [fetched, setFetched] = useState<boolean>(false);
    const [canSearch, setCanSearch] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const { stateContext } = useContext(StateContext);
    
    const gridRef = (ref: Grid) => {
        if (ref && (stateContext.selectedAlbum[0] !== 0 || stateContext.selectedAlbum[1] !== 0)) {
            ref.scrollToItem({ columnIndex: stateContext.selectedAlbum[1], rowIndex: stateContext.selectedAlbum[0], align: "center" });
        }
    }

    useEffect(() => {
        const fetch = async () => {
            const al = await VLC.getAlbums();
            if (al.status === "ok") {
                setAlbums(al.value!);
                setFilteredAlbums(al.value!);
            }
            setFetched(true);

        }
        if (!fetched) {
            fetch();
        }
    }, [fetched]);

    const search = (val: any) => {
        if (val.target.value.length === 0) {
            setFilteredAlbums(albums);
        }
        else {
            setFilteredAlbums(albums.filter(s => s.name.toUpperCase().indexOf(val.target.value.toUpperCase()) !== -1));
        }
    }

    useEffect(() => {
        if (canSearch) {
            searchRef.current!.focus();
        }
    }, [canSearch]);

    const toggleSearch = () => {
        setCanSearch(!canSearch);
    }

    const { gridProps, autoFillRef, columnCount } = useAutoFill(filteredAlbums);

    const AlbumCardWrapper = useCallback(({ data, style, columnIndex, rowIndex }: GridChildComponentProps<IAlbumArtistResponse[]>) => {
        const index = rowIndex * columnCount + columnIndex;
        if (data[index] === undefined) {
            return (<></>);
        }
        return (<div style={{ ...style }} key={`${rowIndex},${columnIndex}`} id={`${rowIndex},${columnIndex}`}>
            <AlbumCard item={data[index]} forceWidth={false} columnIndex={columnIndex} rowIndex={rowIndex} />
        </div>
        )
    }, [columnCount]);

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
            <div ref={autoFillRef} style={{ height: "100%", width: "100%" }}>
                <Grid ref={gridRef}
                    {...gridProps}
                    useIsScrolling={true}
                    style={{overflowY:"auto",overflowX:"hidden"}}
                    itemData={filteredAlbums}>
                    {AlbumCardWrapper}
                </Grid>
            </div>
        </div>
    </>

    )
}
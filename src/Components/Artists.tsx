import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { StateContext } from "../AppContext";
import { IArtist } from "../Models/API/Responses/IArtist";
import ArtistCard from "./ArtistCard";
import "./Artists.scss";
import Loading from "./Loading";
import { FixedSizeGrid as Grid, GridChildComponentProps } from "react-window";
import useAutoFill from "../Hooks/useAutoFill";
import VLC from "../Plugins/VLC";

export default function Artists() {
    const [artists, setArtists] = useState<IArtist[]>([]);
    const [filteredArtists, setFilteredArtists] = useState<IArtist[]>([]);
    const [fetched, setFetched] = useState<boolean>(false);
    const [canSearch, setCanSearch] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const { stateContext } = useContext(StateContext);

    const gridRef = (ref: Grid) => {
        if (
            ref &&
            (stateContext.selectedArtist[0] !== 0 ||
                stateContext.selectedArtist[1] !== 0)
        ) {
            ref.scrollToItem({
                columnIndex: stateContext.selectedArtist[1],
                rowIndex: stateContext.selectedArtist[0],
                align: "center",
            });
        }
    };

    useEffect(() => {
        const fetch = async () => {
            const ar = await VLC.getArtists();
            if (ar.status === "ok") {
                setArtists(ar.value!);
                setFilteredArtists(ar.value!);
                setFetched(true);
            }
        };
        if (!fetched) {
            fetch();
        }
    }, [fetched]);

    const search = (val: any) => {
        if (val.target.value.length === 0) {
            setFilteredArtists(artists);
        } else {
            setFilteredArtists(
                artists.filter(
                    (s) =>
                        s.name
                            .toUpperCase()
                            .indexOf(val.target.value.toUpperCase()) !== -1
                )
            );
        }
    };
    useEffect(() => {
        if (canSearch) {
            searchRef.current!.focus();
        }
    }, [canSearch]);

    const toggleSearch = () => {
        setCanSearch(!canSearch);
    };

    const { gridProps, autoFillRef, columnCount } =
        useAutoFill(filteredArtists);

    const ArtistCardWrapper = useCallback(
        ({
            data,
            style,
            columnIndex,
            rowIndex,
        }: GridChildComponentProps<IArtist[]>) => {
            const index = rowIndex * columnCount + columnIndex;
            if (data[index] === undefined) {
                return <></>;
            }
            return (
                <div
                    style={{ ...style }}
                    id={`${rowIndex},${columnIndex}`}
                    key={`${rowIndex},${columnIndex}`}
                >
                    <ArtistCard
                        item={data[index]}
                        columnIndex={columnIndex}
                        rowIndex={rowIndex}
                    />
                </div>
            );
        },
        [columnCount]
    );

    if (artists.length === 0) {
        return (
            <div className="row">
                <div
                    className="col-12 d-flex align-items-center justify-content-center"
                    style={{ height: "100%" }}
                >
                    <Loading />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className=" artist-list-container d-flex flex-column">
                <div className="d-flex flex-row align-items-center justify-content-between w-100">
                    <div className="section-header text-white">Artists</div>
                    <button
                        type="button"
                        className="btn btn-link text-white"
                        onClick={toggleSearch}
                    >
                        <FontAwesomeIcon
                            icon={faMagnifyingGlass}
                        ></FontAwesomeIcon>
                    </button>
                </div>
                <input
                    ref={searchRef}
                    className={classNames(
                        "form-control",
                        "mb-2",
                        canSearch ? "" : "d-none"
                    )}
                    placeholder="Search..."
                    onKeyUp={search}
                />
                <div
                    style={{ height: "100%", width: "100%" }}
                    ref={autoFillRef}
                >
                    <Grid
                        {...gridProps}
                        ref={gridRef}
                        itemData={filteredArtists}
                        style={{ overflowY: "auto", overflowX: "hidden" }}
                    >
                        {ArtistCardWrapper}
                    </Grid>
                </div>
            </div>
        </>
    );
}

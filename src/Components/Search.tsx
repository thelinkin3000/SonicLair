import { useContext, useEffect, useRef, useState } from "react";
import SearchBackend from "../Api/SearchBackend";
import { AppContext } from "../AppContext";
import { ISearchResponse } from "../Models/API/Responses/IArtistInfoResponse";
import AlbumCard from "./AlbumCard";
import ArtistCard from "./ArtistCard";
import RandomSongCard from "./RandomSongCard";

export default function Search() {
    const { context } = useContext(AppContext);
    const [searchValue, setSearchValue] = useState<string>("");
    const [result, setResult] = useState<ISearchResponse | null>(null);
    const setValue = (ev: any) => {
        setSearchValue(ev.target.value);
    }
    const timeoutRef = useRef<NodeJS.Timeout>(setTimeout(() => {},500));

    useEffect(() => {
        const fetch = async () => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(async () => {
                const result = await SearchBackend(context, searchValue);
                setResult(result);
            },350);
        };
        if (searchValue !== "") {
            fetch();
        }
        else {
            clearTimeout(timeoutRef.current);
            setResult(null);
        }
    }, [searchValue]);
    return (<>
        <div className="text-white section-header text-start">Search</div>
        <input type="text" className="form-control mb-2" value={searchValue} onChange={setValue} />
        {result === null ? <span className="text-white w-100 text-center">
                Write in the textbox to search artists, albums and songs
            </span> : ""}
        <div className="d-flex flex-column align-items-center justify-content-start overflow-auto" style={{ height: "100%" }}>

            {result?.searchResult3?.artist && (
                <>
                    <div className="col-12 text-start" style={{ height: "auto" }}>
                        <span className="section-header text-white">Artists</span>
                        <hr className="text-white w-100" />
                    </div>
                    <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
                        <div className="d-flex flex-row">
                            {result.searchResult3.artist?.map(s => <div style={{ margin: "10px" }}>
                                <ArtistCard item={s} forceWidth={true} />
                            </div>
                            )}

                        </div>
                    </div></>)}
            {result?.searchResult3.album &&
                (<><div className="col-12 text-start" style={{ height: "auto" }}>
                    <span className="section-header text-white">Albums</span>
                    <hr className="text-white w-100" />
                </div>
                    <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
                        <div className="d-flex flex-row">
                            {result.searchResult3.album?.map(s => <div style={{ margin: "10px" }}>
                                <AlbumCard item={s} forceWidth={true} />
                            </div>
                            )}

                        </div>
                    </div></>)}
            {result?.searchResult3?.song &&
                (<><div className="col-12 text-start">
                    <span className="section-header text-white">Songs</span>
                    <hr className="text-white w-100" />
                </div>
                    <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
                        <div className="d-flex flex-row">
                            {result.searchResult3.song?.map(s => <div style={{ margin: "10px" }}>
                                <RandomSongCard item={s} />
                            </div>
                            )}

                        </div>
                    </div></>)
            }
        </div >

    </>
    )
}
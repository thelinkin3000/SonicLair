import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../AppContext";
import { ISearchResponse, ISearchResult } from "../Models/API/Responses/IArtistInfoResponse";
import AndroidTVPlugin from "../Plugins/AndroidTV";
import VLC from "../Plugins/VLC";
import AlbumCard from "./AlbumCard";
import ArtistCard from "./ArtistCard";
import RandomSongCard from "./RandomSongCard";

export default function Search() {
    const [searchValue, setSearchValue] = useState<string>("");
    const [result, setResult] = useState<ISearchResult | null>(null);
    const setValue = (ev: any) => {
        console.log("changing");
        setSearchValue(ev.target.value);
    }
    const [androidTv, setAndroidTv] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(setTimeout(() => { }, 500));
    const songsRef = useRef(null);
    const albumsRef = useRef(null);
    const artistsRef = useRef(null);
    const { focused, ref } = useFocusable();
    useEffect(() => {
        const fetch = async () => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(async () => {
                const result = await VLC.search({ query: searchValue });
                if (result.status === "ok") {
                    console.log(searchValue);
                    console.log(result.value!);
                    setResult(result.value!);

                }
            }, 350);
            setAndroidTv((await AndroidTVPlugin.get()).value);
        };
        if (searchValue !== "") {
            fetch();
        }
        else {
            clearTimeout(timeoutRef.current);
            setResult(null);
        }
    }, [searchValue]);
    useEffect(() => {
        if (focused) {
            ref.current.focus();
        }
        else {
            ref.current.blur();
        }
    }, [focused]);
    return (<>
        <div className="text-white section-header text-start">Search</div>
        <input ref={ref} type="text" className="form-control mb-2" value={searchValue} onChange={setValue} />
        {result === null ? <span className="text-white w-100 text-center">
            Write in the textbox to search artists, albums and songs
        </span> : ""}
        <div className="d-flex flex-column align-items-center justify-content-start overflow-auto" style={{ height: "100%" }}>

            {result?.artist && !androidTv && (
                <>
                    <div ref={artistsRef} className="col-12 text-start" style={{ height: "auto" }}>
                        <span className="section-header text-white">Artists</span>
                        <hr className="text-white w-100" />
                    </div>
                    <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
                        <div className="d-flex flex-row">
                            {result.artist?.map(s => <div style={{ margin: "10px" }}>
                                <ArtistCard item={s} forceWidth={true} parentRef={artistsRef} />
                            </div>
                            )}

                        </div>
                    </div></>)}
            {result?.album &&
                (<>
                    <div ref={albumsRef} className="col-12 text-start" style={{ height: "auto" }}>
                        <span className="section-header text-white">Albums</span>
                        <hr className="text-white w-100" />
                    </div>
                    <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
                        <div className="d-flex flex-row">
                            {result.album?.map(s => <div style={{ margin: "10px" }}>
                                <AlbumCard item={s} forceWidth={true} parentRef={albumsRef} />
                            </div>
                            )}

                        </div>
                    </div></>)}
            {result?.song &&
                (<><div ref={songsRef} className="col-12 text-start">
                    <span className="section-header text-white">Songs</span>
                    <hr className="text-white w-100" />
                </div>
                    <div className="col-12 overflow-scroll scrollable scrollable-hidden" style={{ height: "auto" }}>
                        <div className="d-flex flex-row">
                            {result.song?.map(s => <div style={{ margin: "10px" }}>
                                <RandomSongCard item={s} parentRef={songsRef} />
                            </div>
                            )}

                        </div>
                    </div></>)
            }
        </div >

    </>
    )
}
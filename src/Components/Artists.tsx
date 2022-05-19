import { SyntheticEvent, useContext, useEffect, useState } from "react";
import GetArtists from "../Api/GetArtists";
import { AppContext } from "../AppContext";
import { IArtist } from "../Models/API/Responses/IArtist";
import ArtistCard from "./ArtistCard";
import "./Artists.scss";
import Loading from "./Loading";

export default function Artists() {
    const [artists, setArtists] = useState<IArtist[]>([]);
    const [filteredArtists, setFilteredArtists] = useState<IArtist[]>([]);
    const [fetched, setFetched] = useState<boolean>(false);
    const { context } = useContext(AppContext);
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

    if (artists.length === 0) {
        return (<div className="row">
        <div className="col-12 d-flex align-items-center justify-content-center" style={{height:"80vh"}}>
            <Loading />
        </div>
    </div>);
    }
    return (<>
        <div className="artist-container d-flex flex-column">
            <input className="form-control" placeholder="Search..." onKeyUp={search} />
            <div className="grid-list-container scrollable">
                <div className="grid-list">
                    {filteredArtists.map(s => <ArtistCard item={s} key={s.id}/>)}
                </div>
            </div>
        </div>
    </>

    )
}
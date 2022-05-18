import { SyntheticEvent, useContext, useEffect, useState } from "react";
import GetArtists from "../Api/GetArtists";
import { AppContext } from "../AppContext";
import { IArtist } from "../Models/API/Responses/IArtist";
import ArtistCard from "./ArtistCard";
import "./Artists.scss";

export default function Artists() {
    const [artists, setArtists] = useState<IArtist[]>([]);
    const [filteredArtists, setFilteredArtists] = useState<IArtist[]>([]);
    const [fetched, setFetched] = useState<boolean>(false);
    const { context } = useContext(AppContext);
    useEffect(() => {
        const fetch = async () => {
            const ar = (await GetArtists(context));
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
            <div className="col-12 text-center">
                Cargando artistas...
            </div>
        </div>);
    }
    return (<>
        <div className="row">
            <div className="col-12">
                <input className="form-control" placeholder="Search..." onKeyUp={search} />
            </div>
        </div>
        <div className="grid-list-container scrollable">
            <div className="grid-list">
                {filteredArtists.map(s => <ArtistCard item={s} />)}
            </div>

        </div>
    </>

    )
}
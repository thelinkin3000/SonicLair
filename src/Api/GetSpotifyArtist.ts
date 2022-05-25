import axios from "axios";
import qs from "qs";
import { ISpotifyArtistItem, ISpotifyArtistsSearch } from "../Models/API/Responses/ISpotifyResponse";
import { ISpotifyToken } from "./GetSpotifyToken";


export default async function GetSpotifyArtist(token: string, query: string): Promise<ISpotifyArtistItem[]> {
    const params = {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        params: {
            q: query,
            type: "artist"

        }
    };

    try {
        const response = await axios.get<ISpotifyArtistsSearch>(
            'https://api.spotify.com/v1/search',
            params
        );
        return response.data.artists.items;
    } catch (error) {
        return [];
    }
}

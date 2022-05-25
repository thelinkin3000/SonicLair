import axios from "axios";
import { Buffer } from 'buffer';
import qs from 'qs';

export interface ISpotifyToken {
    token: string;
}

export default async function GetSpotifyToken() : Promise<string> {
    var client_id = '3cb3ecad8ce14e1dba560e3b5ceb908b';
    var client_secret = '86810d6f234142a9bf7be9d2a924bbba';

    const headers = {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
            username: client_id,
            password: client_secret,
        },
    };
    const data = {
        grant_type: 'client_credentials',
    };

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            qs.stringify(data),
            headers
        );
        return response.data.access_token;
    } catch (error) {
        throw error;
    }
}


export interface ISpotifyArtistsSearch {
    artists: {
        href: string,
        items: ISpotifyArtistItem[]
    }
}

export interface ISpotifyArtistItem {
    external_urls: {
        spotify: string
    },
    followers: {
        href?: string,
        total: number
    },
    genres: string[],
    href: string,
    id: string,
    images: ISpotifyImage[],
    name: string,
    popularity: number,
    type: string,
    uri: string
}

export interface ISpotifyImage {
    height: number,
    url: string,
    width: number
}

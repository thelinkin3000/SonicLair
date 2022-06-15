package tech.logica10.soniclair.models

class AlbumWithSongs(
    var song: List<Song>, id: String, name: String, coverArt: String,
    songCount: Int, created: String, duration: Int, artist: String, artistId: String, year: Int
) : Album(
    id, name,
    coverArt, songCount, created, duration, artist, artistId, year
) {
    constructor(album: Album) : this(
        listOf(),
        album.id,
        album.name,
        album.coverArt,
        album.songCount,
        album.created,
        album.duration,
        album.artist,
        album.artistId,
        album.year
    )
}
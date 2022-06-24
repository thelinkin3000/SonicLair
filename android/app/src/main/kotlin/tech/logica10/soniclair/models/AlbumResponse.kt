package tech.logica10.soniclair.models

class AlbumResponse(val album: AlbumWithSongs) : SubsonicResponse()

class PlaylistsResponse(val playlists: PlaylistsInnerResponse) : SubsonicResponse()

class PlaylistsInnerResponse(val playlist: List<Playlist>)

class PlaylistResponse(val playlist: Playlist) : SubsonicResponse()

class Playlist(
    val id: String,
    val name: String,
    val comment: String,
    val owner: String,
    val public: Boolean,
    val songCount: Int,
    val duration: Int,
    val created: String,
    val coverArt: String,
    val entry: List<Song>
)
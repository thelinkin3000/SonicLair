package tech.logica10.soniclair.models

import androidx.room.Ignore

class AlbumResponse(val album: AlbumWithSongs) : SubsonicResponse()

class PlaylistsResponse(val playlists: PlaylistsInnerResponse) : SubsonicResponse()

class PlaylistsInnerResponse(val playlist: List<Playlist>)

class PlaylistResponse(val playlist: Playlist) : SubsonicResponse()

class Playlist(
    val id: String,
    val name: String,
    val comment: String?,
    val owner: String,
    val public: Boolean,
    val songCount: Int,
    val duration: Int,
    val created: String,
    val coverArt: String?,
    val entry: List<Song>
) : ICardViewModel {
    override fun firstLine(): String {
        return name
    }

    override fun secondLine(): String {
        return if(comment.isNullOrBlank()) "by ${owner}" else comment
    }

    @Ignore
    private var _image: String = "";

    override var image: String
        get() {
            return _image
        }
        set(value) {
            _image = value
        }

}
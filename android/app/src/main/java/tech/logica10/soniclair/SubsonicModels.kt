package tech.logica10.soniclair

import android.media.MediaDescription
import android.media.browse.MediaBrowser
import android.net.Uri
import com.bumptech.glide.Glide

class SubsonicModels {
    open class SubsonicResponse {
        val serverVersion: String = ""
        val status: String = ""
        val type: String = ""
        val version: String = ""
        val error: SubsonicError? = null
    }

    class Context(
        val accounts: List<Account> = emptyList(),
        val activeAccount: Account = Account(null, "", "", ""),
    )

    class SubsonicError {
        val message: String = ""
        val code: Int = 0

    }

    class BackendResponse<T>(val value: T) {
        val status: String = ""
        val error: String = ""
    }

    class BasicParams(
        val u: String,
        val t: String,
        val s: String,
        val v: String,
        val c: String,
        val f: String
    ) {
        fun asMap(): HashMap<String, String> {
            val ret = HashMap<String, String>()
            ret["u"] = u
            ret["t"] = t
            ret["s"] = s
            ret["v"] = v
            ret["c"] = c
            ret["f"] = f
            return ret
        }
    }

    class ArtistsSubsonicResponse(val artists: InnerArtistsSubsonicResponse) : SubsonicResponse()

    class InnerArtistsSubsonicResponse(val ignoredArticles: String, val index: List<ArtistIndex>)

    class ArtistIndex(val name: String, val length: Int, val artist: List<ArtistListItem>)

    class ArtistListItem(
        val id: String,
        val name: String,
        val albumCount: Int,
        val artistImageUrl: String
    )

    class ArtistSubsonicResponse(val artist: InnerArtistSubsonicResponse) : SubsonicResponse()

    class InnerArtistSubsonicResponse(
        val id: String,
        val name: String,
        val coverArt: String,
        val albumCount: Int,
        val album: List<Album>
    )

    class ArtistInfoResponse(val artistInfo2: ArtistInfo) : SubsonicResponse()

    class ArtistInfo(
        val biography: String,
        val largeImageUrl: String,
        val smallImageUrl: String,
        val mediumImageUrl: String,
    )

    class AlbumsResponse(val albumList2: AlbumList2) : SubsonicResponse()

    class AlbumList2(val album: List<Album>)

    class AlbumResponse(val album: AlbumWithSongs) : SubsonicResponse()

    open class Album(
        val id: String,
        val name: String,
        val coverArt: String,
        val songCount: Int,
        val created: String,
        val duration: Int,
        val artist: String,
        val artistId: String,
        val year: Int
    )

    class AlbumWithSongs(
        val song: List<Song>, id: String, name: String, coverArt: String,
        songCount: Int, created: String, duration: Int, artist: String, artistId: String, year: Int
    ) : Album(
        id, name,
        coverArt, songCount, created, duration, artist, artistId, year
    )


    class RandomSongsResponse(val randomSongs: RandomSongs) : SubsonicResponse()

    class RandomSongs(val song: List<Song>)

    class SimilarSongsResponse(val similarSongs2: SimilarSongs) : SubsonicResponse()

    class SimilarSongs(val song: List<Song>)

    class SongResponse(val song: Song) : SubsonicResponse()

    class Song(
        val id: String,
        val parent: String,
        val title: String,
        val duration: Int,
        val track: Int,
        val artist: String,
        val album: String,
        val albumId: String,
        val coverArt: String
    )

    class SearchResponse(
        val searchResult3: SearchResult
    ): SubsonicResponse()

    class SearchResult(
        val album: List<Album>?,
        val artist: List<ArtistListItem>?,
        val song: List<Song>?
    )
}
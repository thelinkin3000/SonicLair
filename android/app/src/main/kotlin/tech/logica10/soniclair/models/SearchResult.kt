@file:Suppress("unused")

package tech.logica10.soniclair.models


class SearchResult(
    val album: List<Album>?,
    val artist: List<ArtistListItem>?,
    val song: List<Song>?
)

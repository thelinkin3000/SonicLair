package tech.logica10.soniclair.models

import androidx.room.Entity
import androidx.room.Ignore
import androidx.room.PrimaryKey

@Entity
class Artist(
    @PrimaryKey(autoGenerate = false)
    var id: String,
    var name: String,
    @Ignore
    var coverArt: String = "",
    var albumCount: Int,
    @Ignore
    var album: List<Album> = listOf()
){
    constructor(id: String,
                name: String,
                albumCount: Int):this(id, name, "", albumCount, listOf())
}
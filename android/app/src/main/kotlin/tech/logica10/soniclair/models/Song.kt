package tech.logica10.soniclair.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity
class Song(
    @PrimaryKey(autoGenerate = false)
    var id: String,
    var parent: String,
    var title: String,
    var duration: Int,
    var track: Int,
    var artist: String,
    var album: String,
    var albumId: String,
    var coverArt: String
)
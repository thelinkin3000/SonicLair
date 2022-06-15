package tech.logica10.soniclair.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity
open class Album(
    @PrimaryKey(autoGenerate = false)
    var id: String,
    var name: String,
    var coverArt: String,
    var songCount: Int,
    var created: String,
    var duration: Int,
    var artist: String,
    var artistId: String,
    var year: Int
)
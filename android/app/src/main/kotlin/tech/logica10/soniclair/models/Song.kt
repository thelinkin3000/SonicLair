package tech.logica10.soniclair.models

import androidx.room.Entity
import androidx.room.Ignore
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
    var coverArt: String,
) : ICardViewModel {
    override fun firstLine(): String {
        return title
    }

    override fun secondLine(): String {
        return "by $artist"
    }

    @Ignore
    private var _image: String = ""

    override var image: String
        get() {
            return _image
        }
        set(value) {
            _image = value
        }
}


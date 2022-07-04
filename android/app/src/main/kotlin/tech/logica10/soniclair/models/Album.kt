package tech.logica10.soniclair.models

import androidx.room.Entity
import androidx.room.Ignore
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
) : ICardViewModel {
    override fun firstLine(): String {
        return name;
    }

    override fun secondLine(): String {
        return year.toString()
    }

    private var _image: String = "";

    override var image: String
        get() {
            return _image
        }
        set(value) {
            _image = value
        }

}
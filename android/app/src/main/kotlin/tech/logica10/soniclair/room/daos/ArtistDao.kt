package tech.logica10.soniclair.room.daos

import androidx.room.*
import tech.logica10.soniclair.models.Artist

@Dao
interface ArtistDao {
    @Query("SELECT * from Artist")
    fun getAll(): List<Artist>

    @Query("SELECT * from Artist WHERE id = :id")
    fun get(id: String): Artist?

    @Update
    fun update(song: Artist)

    @Update
    fun update(songs: List<Artist>)

    @Delete
    fun delete(song: Artist)

    @Delete
    fun delete(songs: List<Artist>)

    @Insert
    fun insert(song: Artist)

    @Insert
    fun insert(songs: List<Artist>)
}
package tech.logica10.soniclair.room.daos

import androidx.room.*
import tech.logica10.soniclair.models.Album

@Dao
interface AlbumDao {
    @Query("SELECT * from Album")
    fun getAll(): List<Album>

    @Query("SELECT * from Album WHERE id = :id")
    fun get(id: String): Album?

    @Query("SELECT * from Album WHERE artistId = :id")
    fun getByArtist(id: String): List<Album>

    @Update
    fun update(song: Album)

    @Update
    fun update(songs: List<Album>)

    @Delete
    fun delete(song: Album)

    @Delete
    fun delete(songs: List<Album>)

    @Insert
    fun insert(song: Album)

    @Insert
    fun insert(songs: List<Album>)
}
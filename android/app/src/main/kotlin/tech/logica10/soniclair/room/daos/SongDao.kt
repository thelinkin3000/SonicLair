package tech.logica10.soniclair.room.daos

import androidx.room.*
import tech.logica10.soniclair.models.Song

@Dao
interface SongDao {
    @Query("SELECT * from Song")
    fun getAll(): List<Song>

    @Query("SELECT * from Song WHERE id = :id")
    fun get(id: String): Song?

    @Query("SELECT * from Song WHERE albumId = :id")
    fun getByAlbum(id: String): List<Song>

    @Update
    fun update(song: Song)

    @Update
    fun update(songs: List<Song>)

    @Delete
    fun delete(song: Song)

    @Delete
    fun delete(songs: List<Song>)

    @Insert
    fun insert(song:Song)

    @Insert
    fun insert(songs: List<Song>)
}



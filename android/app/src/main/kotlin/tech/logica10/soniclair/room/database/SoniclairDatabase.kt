package tech.logica10.soniclair.room.database

import androidx.room.Database
import androidx.room.RoomDatabase
import tech.logica10.soniclair.models.Album
import tech.logica10.soniclair.models.Artist
import tech.logica10.soniclair.models.Song
import tech.logica10.soniclair.room.daos.AlbumDao
import tech.logica10.soniclair.room.daos.ArtistDao
import tech.logica10.soniclair.room.daos.SongDao

@Database(entities = [Song::class, Album::class, Artist::class], version = 2, exportSchema = false)
abstract class SoniclairDatabase: RoomDatabase() {
    abstract fun songDao(): SongDao;
    abstract fun albumDao(): AlbumDao;
    abstract fun artistDao(): ArtistDao;
}
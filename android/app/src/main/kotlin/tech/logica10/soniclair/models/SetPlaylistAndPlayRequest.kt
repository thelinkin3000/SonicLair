package tech.logica10.soniclair.models

class SetPlaylistAndPlayRequest(val playlist: List<Song>, val track: Int, val seek: Float, val playing: Boolean)
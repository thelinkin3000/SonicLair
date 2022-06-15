package tech.logica10.soniclair

import tech.logica10.soniclair.models.Song

class CurrentState(val playing: Boolean,
val position: Float,
val currentTrack: Song
)
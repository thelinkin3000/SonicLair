package tech.logica10.soniclair.models

class BackendResponse<T>(val value: T) {
    val status: String = ""
    val error: String = ""
}
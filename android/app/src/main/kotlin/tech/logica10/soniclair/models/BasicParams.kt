package tech.logica10.soniclair.models

class BasicParams(
    val u: String,
    val t: String,
    val s: String,
    val v: String,
    val c: String,
    val f: String
) {
    fun asMap(): HashMap<String, String> {
        val ret = HashMap<String, String>()
        ret["u"] = u
        ret["t"] = t
        ret["s"] = s
        ret["v"] = v
        ret["c"] = c
        ret["f"] = f
        return ret
    }
}
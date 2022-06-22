package tech.logica10.soniclair.models

class BasicParams(
    val u: String,
    val t: String?,
    val s: String?,
    val v: String,
    val c: String,
    val f: String,
    val p: String?,
) {
    fun asMap(): HashMap<String, String> {
        val ret = HashMap<String, String>()
        ret["u"] = u
        if (t != null) {
            ret["t"] = t
        }
        if (s != null) {
            ret["s"] = s
        }
        if (p != null) {
            ret["p"] = p
        }
        ret["v"] = v
        ret["c"] = c
        ret["f"] = f
        return ret
    }
}
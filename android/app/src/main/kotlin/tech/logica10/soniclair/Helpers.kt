package tech.logica10.soniclair

class Helpers {
    companion object{
        fun constructPath(paths: List<String>) :String{
            val builder = StringBuilder();
            paths.forEach{
                builder.append(it.trim('/'))
                builder.append("/")
            }
            return builder.toString().trimEnd('/')
        }
    }
}
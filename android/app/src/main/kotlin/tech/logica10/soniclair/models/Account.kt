package tech.logica10.soniclair.models

import tech.logica10.soniclair.TvLoginActivity

class Account(
    val username: String?,
    val password: String,
    val url: String,
    var type: String,
    var usePlaintext: Boolean
) {
    constructor(formdata: TvLoginActivity.FormData) : this(
        formdata.username,
        formdata.password,
        formdata.url,
        "",
        false
    )
}


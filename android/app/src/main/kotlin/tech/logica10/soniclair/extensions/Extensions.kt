package tech.logica10.soniclair.extensions

import android.widget.ImageView
import com.bumptech.glide.Glide
import tech.logica10.soniclair.R

fun ImageView.loadUrl(url: String) {
    try {
        Glide.with(context).load(url).into(this)
    } catch (e: Exception) {
        Glide.with(context).load(R.drawable.ic_album_art_placeholder).into(this)
    }
}
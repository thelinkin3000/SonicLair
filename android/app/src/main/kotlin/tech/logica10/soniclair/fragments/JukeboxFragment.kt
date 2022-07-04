package tech.logica10.soniclair.fragments

import android.graphics.Bitmap
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.google.zxing.BarcodeFormat
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter
import tech.logica10.soniclair.App
import tech.logica10.soniclair.Helpers.Companion.encodeAsBitmap
import tech.logica10.soniclair.R


class JukeboxFragment : Fragment() {


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_jukebox, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val image: ImageView = view.findViewById(R.id.iv_jukebox_qr)
        val text: TextView = view.findViewById(R.id.tv_jukebox_ip)
        val ip = if (App.localIp == null) "127.0.0.1" else "${App.localIp}j"
        val bitmap = encodeAsBitmap(ip)
        image.setImageBitmap(bitmap)
        text.text = ip.trimEnd('j')
    }
}
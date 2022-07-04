package tech.logica10.soniclair

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.common.BitMatrix
import com.google.zxing.qrcode.QRCodeWriter

class Helpers {
    companion object{
        fun constructPath(paths: List<String>) :String{
            val builder = StringBuilder();
            paths.forEach{
                builder.append(it.trimEnd('/'))
                builder.append("/")
            }
            return builder.toString().trimEnd('/')
        }

        fun encodeAsBitmap(str: String?): Bitmap? {
            val writer = QRCodeWriter()
            val bitMatrix: BitMatrix = writer.encode(str, BarcodeFormat.QR_CODE, 800, 800)
            val w: Int = bitMatrix.width
            val h: Int = bitMatrix.height
            val pixels = IntArray(w * h)
            for (y in 0 until h) {
                for (x in 0 until w) {
                    pixels[y * w + x] =
                        if (bitMatrix.get(x, y)) Color.parseColor("#282c34") else Color.WHITE
                }
            }
            val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            bitmap.setPixels(pixels, 0, w, 0, 0, w, h)
            return bitmap
        }
    }
}
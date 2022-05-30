package tech.logica10.soniclair

import android.app.UiModeManager
import android.content.Context.UI_MODE_SERVICE
import android.content.res.Configuration
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "AndroidTV")
class AndroidTVPlugin : Plugin() {
    @PluginMethod()
    fun get(call: PluginCall) {
        val uiModeManager: UiModeManager =
            MainActivity.context.getSystemService(UI_MODE_SERVICE) as UiModeManager;
        val ret = JSObject();
        if (uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
            ret.put("androidTv", true);
        } else {
            ret.put("androidTv", false);
        }
        call.resolve(ret);
    }
}
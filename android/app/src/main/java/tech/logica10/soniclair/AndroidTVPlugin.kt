package tech.logica10.soniclair

import android.app.UiModeManager
import android.content.Context.UI_MODE_SERVICE
import android.content.res.Configuration
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.gson.Gson
import tech.logica10.soniclair.App.Companion.pairString

@CapacitorPlugin(name = "AndroidTV")
class AndroidTVPlugin : Plugin(), IBroadcastObserver {
    private val gson: Gson = Gson()

    override fun load(){
        Globals.RegisterObserver(this);
    }

    @PluginMethod()
    fun getIp(call: PluginCall) {
        val ret = JSObject()
        ret.put("value", pairString ?: "")
        call.resolve(ret)
    }

    @PluginMethod()
    fun get(call: PluginCall) {
        val uiModeManager: UiModeManager =
            MainActivity.context.getSystemService(UI_MODE_SERVICE) as UiModeManager
        val ret = JSObject()
        if (uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION) {
            ret.put("value", true)
        } else {
            ret.put("value", false)
        }
        call.resolve(ret)
    }

    override fun update(action: String?, value: String?) {
        if (action.equals("WSLOGIN")) {
            try {
                val account: Account = gson.fromJson(value, Account::class.java)
                notifyListeners("login", JSObject(gson.toJson(account)))
            } catch (e: Exception) {

            }
        }
    }


}
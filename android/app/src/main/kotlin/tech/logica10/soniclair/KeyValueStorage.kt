package tech.logica10.soniclair

import android.content.Context
import com.google.gson.Gson
import tech.logica10.soniclair.SubsonicModels.*

class KeyValueStorage {
    companion object {
        fun getSettings(): Settings {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            val currentSettings = sharedPref.getString("settings", "")
            return try {
                val settings: Settings = Gson().fromJson(currentSettings, Settings::class.java)
                settings
            } catch (exception: Exception) {
                Settings(0)
            }
        }

        fun setSettings(settings: Settings) {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                putString("settings", Gson().toJson(settings))
                apply()
            }
        }

        fun getActiveAccount(): Account {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            val activeAccount = sharedPref.getString("activeAccount", "")
            return try {
                val account: Account = Gson().fromJson(activeAccount, Account::class.java)
                account
            } catch (exception: Exception) {
                Account(null, "", "", "")
            }
        }

        fun setActiveAccount(account: Account) {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                putString("activeAccount", Gson().toJson(account))
                apply()
            }
        }

        fun getAccounts(): List<Account> {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            val activeAccount = sharedPref.getString("accounts", "")
            return try {
                val accounts: List<Account> =
                    Gson().fromJson(activeAccount, Array<Account>::class.java).toList()
                accounts
            } catch (exception: Exception) {
                emptyList()
            }
        }

        fun setAccounts(accounts: List<Account>) {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                val value = Gson().toJson(accounts)
                putString("accounts", value)
                apply()
            }
        }

        fun getCachedSongs(): List<Song> {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            val activeAccount = sharedPref.getString("cachedSongs", "")
            return try {
                val mediaItems: List<Song> =
                    Gson().fromJson(activeAccount, Array<Song>::class.java)
                        .toList()
                mediaItems
            } catch (exception: Exception) {
                emptyList()
            }
        }

        fun setCachedSongs(accounts: List<Song>) {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                val value = Gson().toJson(accounts)
                putString("cachedSongs", value)
                apply()
            }
        }

    }
}
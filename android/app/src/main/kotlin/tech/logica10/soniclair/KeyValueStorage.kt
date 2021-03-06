package tech.logica10.soniclair

import android.content.Context
import com.google.gson.Gson
import tech.logica10.soniclair.models.*

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
                Settings(0, "")
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
                Account(null, "", "", "", false)
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

        fun getCachedPlaylists(): List<Playlist> {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            val activeAccount = sharedPref.getString("cachedPlaylists", "")
            return try {
                val mediaItems: List<Playlist> =
                    Gson().fromJson(activeAccount, Array<Playlist>::class.java)
                        .toList()
                mediaItems
            } catch (exception: Exception) {
                emptyList()
            }
        }

        fun setCachedPlaylists(accounts: List<Playlist>) {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                val value = Gson().toJson(accounts)
                putString("cachedPlaylists", value)
                apply()
            }
        }
        fun getCachedAlbums(): List<Album> {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            val activeAccount = sharedPref.getString("cachedAlbums", "")
            return try {
                val mediaItems: List<Album> =
                    Gson().fromJson(activeAccount, Array<Album>::class.java)
                        .toList()
                mediaItems
            } catch (exception: Exception) {
                emptyList()
            }
        }

        fun setCachedAlbums(accounts: List<Album>) {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                val value = Gson().toJson(accounts)
                putString("cachedAlbums", value)
                apply()
            }
        }

        fun getOfflineMode(): Boolean {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            return sharedPref.getBoolean("offlineMode", false)
        }

        fun setOfflineMode(value: Boolean) {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                putBoolean("offlineMode", value)
                apply()
            }
        }

        fun getTranscoding(): String {
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            return sharedPref.getString("transcoding", "")!!
        }

        fun setTranscoding(value: String){
            val sharedPref =
                App.context.getSharedPreferences("sonicLair", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                putString("transcoding", value)
                apply()
            }
        }
    }
}
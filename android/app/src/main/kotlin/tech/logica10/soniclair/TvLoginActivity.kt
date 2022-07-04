package tech.logica10.soniclair

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doOnTextChanged
import com.google.android.material.textfield.TextInputLayout
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import tech.logica10.soniclair.models.Account

class TvLoginActivity : AppCompatActivity() {
    private lateinit var userInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var urlInput: EditText
    private lateinit var userLayout: TextInputLayout
    private lateinit var passwordLayout: TextInputLayout
    private lateinit var urlLayout: TextInputLayout
    private lateinit var loginButton: Button


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tv_login)
    }

    private fun getFormData(): FormData {
        return FormData(
            userInput.text.toString(),
            passwordInput.text.toString(),
            urlInput.text.toString()
        )
    }

    inner class FormData(val username: String, val password: String, val url: String) {
        fun validate(): String {
            if (username.trim() == "") {
                return "The username is required"
            }
            if (password.trim() == "") {
                return "The password is required"
            }
            if (url.trim() == "") {
                return "The url is required"
            }
            return ""
        }
    }

    private fun tryLogin(account: Account) {
        val client = SubsonicClient(account)
        try {
            runBlocking(Dispatchers.IO) {
                client.login(account.username!!, account.password, account.url, false)
            }
            val intent = Intent(this, TvActivity::class.java)
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(
                this,
                e.message ?: "There was an unexpected error",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    inner class WsLogin : IBroadcastObserver {
        override fun update(action: String?, value: String?) {
            if (action == "WSLOGIN") {
                val account: Account
                try {
                    account = Gson().fromJson(value, Account::class.java)
                    tryLogin(account)
                } catch (e: Exception) {
                    Toast.makeText(
                        this@TvLoginActivity,
                        "The account received is malformed.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }

    }

    override fun onAttachedToWindow() {
        supportActionBar?.hide()
        super.onAttachedToWindow()
        Globals.RegisterObserver(WsLogin())
        val account = KeyValueStorage.getActiveAccount()
        if (account.username != null) {
            tryLogin(account)
        }
        userInput = findViewById(R.id.username_input)
        passwordInput = findViewById(R.id.password_input)
        urlInput = findViewById(R.id.url_input)
        userLayout = findViewById(R.id.username_input_layout)
        passwordLayout = findViewById(R.id.password_input_layout)
        urlLayout = findViewById(R.id.url_input_layout)
        userInput.doOnTextChanged { text, _, _, _ ->
            if ((text?.toString() ?: "") == "") {
                userLayout.isErrorEnabled = true
                userLayout.error = "The username is required"
            } else {
                userLayout.isErrorEnabled = false
            }
        }
        passwordInput.doOnTextChanged { text, _, _, _ ->
            if ((text?.toString() ?: "") == "") {
                passwordLayout.isErrorEnabled = true
                passwordLayout.error = "The password is required"
            } else {
                passwordLayout.isErrorEnabled = false
            }
        }
        urlInput.doOnTextChanged { text, _, _, _ ->
            if ((text?.toString() ?: "") == "") {
                urlLayout.isErrorEnabled = true
                urlLayout.error = "The url is required"
            } else {
                urlLayout.isErrorEnabled = false
            }
        }
        loginButton = findViewById(R.id.btn_tv_login)
        loginButton.setOnClickListener {
            val formdata = getFormData()
            val errors = formdata.validate()
            if (errors == "") {
                tryLogin(Account(formdata))
            } else {
                Toast.makeText(this, errors, Toast.LENGTH_SHORT).show()
            }
        }

    }
}
package tech.logica10.soniclair

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SwitchCompat
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
    private lateinit var plaintext: SwitchCompat


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tv_login)
    }

    private fun getFormData(): FormData {
        return FormData(
            userInput.text.toString(),
            passwordInput.text.toString(),
            urlInput.text.toString(),
            plaintext.isChecked
        )
    }

    inner class FormData(
        val username: String,
        val password: String,
        val url: String,
        val plaintext: Boolean
    ) {
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
                client.login(
                    account.username!!,
                    account.password,
                    account.url,
                    account.usePlaintext
                )
            }
            val intent = Intent(this, TvActivity::class.java)
            finish()
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
        plaintext = findViewById(R.id.switch_plaintext)
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
        val image: ImageView = findViewById(R.id.iv_qr_login)
        val text: TextView = findViewById(R.id.tv_qr_login)
        val layout: LinearLayout = findViewById(R.id.qr_login_container)
        val ip = if (App.localIp == null) "127.0.0.1" else "${App.localIp}"
        val bitmap = Helpers.encodeAsBitmap(ip)
        image.setImageBitmap(bitmap)
        text.text = ip
        val qrButton: Button = findViewById(R.id.btn_tv_qr)
        qrButton.setOnClickListener {
            layout.visibility =
                if (layout.visibility == View.VISIBLE) View.INVISIBLE else View.VISIBLE
        }
    }
}
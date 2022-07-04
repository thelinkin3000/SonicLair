package tech.logica10.soniclair

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import tech.logica10.soniclair.models.Account

class AccountFragment() : Fragment() {
    private lateinit var user: TextView
    private lateinit var server: TextView
    private lateinit var type: TextView
    private lateinit var plaintext: TextView
    private lateinit var logout: Button
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_account, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        user = view.findViewById(R.id.tv_account_user)
        server = view.findViewById(R.id.tv_account_server)
        type = view.findViewById(R.id.tv_account_type)
        plaintext = view.findViewById(R.id.tv_plaintext_warning)
        logout = view.findViewById(R.id.btn_logout)
        val account = KeyValueStorage.getActiveAccount()
        user.text = account.username
        server.text = account.url
        type.text = account.type
        plaintext.visibility = if (account.usePlaintext) View.VISIBLE else View.INVISIBLE
        logout.setOnClickListener {
            KeyValueStorage.setActiveAccount(Account(null, "","","",false))
            val intent = Intent(activity, TvLoginActivity::class.java)
            startActivity(intent)
        }
    }

}
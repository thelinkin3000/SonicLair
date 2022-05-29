package tech.logica10.soniclair

import android.content.Context
import com.google.gson.Gson

class KeyValueStorage() {
    companion object{
        fun getActiveAccount() : Account{
            val sharedPref = App.getContext().getSharedPreferences("sonicLair", Context.MODE_PRIVATE);
            val activeAccount = sharedPref.getString("activeAccount", "");
            return try{
                val account : Account = Gson().fromJson(activeAccount, Account::class.java);
                account;
            }
            catch(exception: Exception){
                Account(null,"","","");
            }
        }
        fun setActiveAccount(account:Account){
            val sharedPref = App.getContext().getSharedPreferences("sonicLair", Context.MODE_PRIVATE);
            with(sharedPref.edit()){
                putString("activeAccount", Gson().toJson(account));
                apply()
            }
        }

        fun getAccounts() : List<Account>{
            val sharedPref = App.getContext().getSharedPreferences("sonicLair", Context.MODE_PRIVATE);
            val activeAccount = sharedPref.getString("accounts", "");
            return try{
                val accounts : List<Account> = Gson().fromJson(activeAccount, Array<Account>::class.java).toList();
                accounts;
            }
            catch(exception: Exception){
                emptyList<Account>();
            }
        }

        fun setAccounts(accounts:List<Account>){
            val sharedPref = App.getContext().getSharedPreferences("sonicLair", Context.MODE_PRIVATE);
            with(sharedPref.edit()){
                val value = Gson().toJson(accounts);
                putString("accounts", value);
                apply()
            }
        }
    }

}
package tech.logica10.soniclair.models

class Context(
    val accounts: List<Account> = emptyList(),
    val activeAccount: Account = Account(null, "", "", ""),
)
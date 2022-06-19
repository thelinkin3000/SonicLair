package tech.logica10.soniclair.models

class ParameterException(val parameter: String): Exception("The $parameter parameter cannot be empty")
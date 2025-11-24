# Basic CompScript Examples

# Get all registered persons
Persons(Registered())

# Get a specific person by WCA ID
Name(2005REYN01)

# Boolean literals
true
false

# Event literals
_333
_333bf
_444
_pyram

# Attempt results
12.34s
DNF
DNS

# Date and DateTime literals
2023-07-01
2023-07-01T10:30:00

# Arrays
[1, 2, 3, 4, 5]
[_333, _444, _555]

# Comparisons
(5 > 3)
(10 <= 20)
("Alice" == "Bob")

# Logical operations
(true && false)
(true || false)

# Arithmetic
(5 + 3)
(10 - 7)
(4 * 6)
(20 / 4)

# Nested function calls
Length(Persons(Registered()))

# Using external parameters
Map(
  Persons(Registered()),
  Name()
)

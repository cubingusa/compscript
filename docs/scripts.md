# CompScript

CompScript is a custom language that allows running various commands and queries over a competition's WCIF data. It is likely that there are bugs or improvements that can be made. Please file issues on [GitHub](https://github.com/timreyn/natshelper) and I'm happy to take a look.

## Intro

The CompScript interpreter can be found at (for example) <http://localhost:3030/CubingUSANationals2023>. You may enter one or more CompScript commands into the box and hit "Submit".

A sample command is
```
Persons((FirstName() == "William"))
```
which returns a list of all competitors whose first name is William. There are many functions available; you may view all of them by running
```
ListFunctions()
```
and you may view the documentation for one function by running
```
Help("Persons")
```
Whitespace is generally ignored, and comments (beginning with python-style `#`) are ignored as well

## Literals

The CompScript parser can understand various expressions, such as:
```
12.345  # Number
"Rubik's Cube"  # String
true  # Boolean
_333  # Event
_333-r1  # Round
22.95s  # AttemptResult
20m  # Fewest Moves result
60p  # Multi Blind number of points
DNF  # DNF
[1, 2, 3]  # Array
2005REYN01  # Person
2023-01-01  # Date
2023-02-03T10:23  # DateTime (ISO-8601 format, using competition time zone)
```

The full grammar is at `parser/grammar.pegjs`.

## Files

In addition to the interpreter box, you can write CompScript scripts in any directory on your local computer. These files can be accessed by setting the environment variable `SCRIPT_BASE`.

CompScript files are parsed using a [C-style preprocessor](https://github.com/ParksProjets/C-Preprocessor), so you can do things like including other files:

```
#include "lib/utilities.cs"
```

For an example, the CubingUSA Nationals 2023 scripts are available [here](https://github.com/cubingusa/nats-scripts).

## Functions and Types

CompScript has many functions. Each of these take zero or more arguments, and has a return type. There may be multiple overloads for one function. For example, `Add()` has overloads that take `Number` and `String`.

Arguments are assumed to be in the order listed in the function, with some exceptions:

- If a parameter is provided with a name, it may appear out of order. For example `Subtract(val2=3, val1=4)` returns 1.
- If an argument is `repeated`, all remaining unnamed parameters provided are assumed to be part of that argument.
- If an argument has a `defaultValue`, its value may be omitted.

Functions can have generic types. For example, one of the overloads of `Add()` takes `Array<$T>` arguments and returns an `Array<$T>`. The type-deduction logic for generics is best-effort; complicated functional types may not be deduced correctly.

Some arguments are marked as `canBeExternal`. This means that, if their value is not provided, the return value is instead a function that taking that as a parameter. For example, `FirstName()` takes a `Person` as an argument, but this can be external. `FirstName(2007BARR01)` would return a `String` ("Kian"), while `FirstName` would return a `String(Person)`. Functional arguments can be passed through any other function, as long as eventually the functional argument is provided.

For example, `RegisteredEvents()` takes a `Person` argument and returns an `Array<Event>`. Without providing a `Person`, the return value would be `Array<Event>(Person)`. The expression `Length(RegisteredEvents())` would have type `Number(Person)`. Finally, this can all be passed to `Map`:

```
Map(
  [2005REYN01, 2008CLEM01, 2011WELC01],
  Length(RegisteredEvents())
)
```

would return `[16, 16, 17]` (for CubingUSA Nationals 2023. Other competitions may vary).

Simply issuing the command `Length(RegisteredEvents())` would return an error, however, as nothing is ever provided as an argument to `RegisteredEvents`.

Some arguments may have multiple external arguments, for example `PsychSheetPosition()`.

In order to avoid null-checking every argument, by default if any arguments are `null` then the function simply returns `null` as well. However, individual arguments may be marked as `nullable` to prevent this propagation.

## User-Defined Functions

You may implement your own function either in Javascript (see the `functions/` folder), or as a combination of other built-in functions. For example, if you find yourself calling `Length(RegisteredEvents())` frequently, you can define a `NumEvents()` function:

```
Define(
  "NumEvents",
  Length(RegisteredEvents())
)
```

If you would like to provide an argument to your user-defined function, you can do so with `{}`:

```
Define(
  "FirstNames",
  Map({1, Array<Person>}, FirstName())
)
```

This says that the first argument should be of type `Array<Person>`.

UDFs are only available for the duration of a request.

## Binary operators

Some functions such as `Add` may be invoked using a binary operator (e.g. `+`). See `BinaryOperation` in `parser/grammar.pegjs` for the full list. Currently this requires the arguments to be surrounded by parentheses (e.g. `(2 + 3)`); improvements to the grammar to remove this requirement are welcome.

## Mutations

Many functions, such as assigning groups, assigning properties to people, and defining functions, are saved on the competition WCIF. Functions may declare that they modify a top-level WCIF field, such as `events`, `schedule`, `persons`, or `extensions`. If so, when the command is complete, a PATCH request will be issued to the WCA website for that field. As a safety measure, there is a "dry-run" field which defaults to true, which allows for testing the command before modifying any
data on the website.

## Rendering

The final output type decides which renderer should be used. See `views/dispatch.pug` for all available renderers. Some special types:

* `Array<$T>` renders each item successively
* `Multi` is like an `Array`, where the type of each object does not have to match. Rendering is similar to `Array`

Some complicated functions like `AssignGroups` define their own output type, since this is easier than rendering via a combination of primitives like `Header` and `Table`. However, such functions can invoke `dispatch` for some sub-outputs in order to avoid reinventing every wheel.

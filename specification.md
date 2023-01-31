# NatsHelper WCIF Extensions

*Version: 1.0*

NatsHelper defines a number of extensions to [WCIF](https://github.com/thewca/wcif), the WCA's specification of competition data. These extensions are documented here, though they shouldn't be consumed by other applications without discussing with us first.

## Objects

We define extensions to a few of the objects defined in the [WCIF spec](https://github.com/thewca/wcif/blob/master/specification.md). For each WCIF object `Object` we define an extension of type `org.cubingusa.natshelper.v1.Object`. Please refer to the WCIF spec for details about what each object represents.

- [Activity](#Activity)
- [Competition](#Competition)
- [Person](#Person)
- [Function](#Function)

### Activity

For a top-level `Activity` (i.e. an `Activity` which is not the `childActivity` of another `Activity`), the following data is stored:

| Attribute | Type | Description |
| --- | --- | --- |
| `adjustment` | `String` | How many groups will be omitted from this `Activity` on this `Room`, relative to other `Room`s. For example, `+2-1` indicates that the first two and last one groups will be skipped. |

### Competition

This is used as global storage for the competition.

| Attribute | Type | Description |
| --- | --- | --- |
| `udf` | `Function` | User-defined functions for this competition. |

### Person

| Attribute | Type | Description |
| --- | --- | --- |
| `properties` | `Object` | A mapping of user-defined key-value pairs. |
| `staffUnavailable` | `Function` | A function returning true for groups that this person is not able to participate as a staff member. |

### Function

Some properties are stored as functions, which can be executed later. The structure of these properties is as follows:

| Attribute | Type | Description |
| --- | --- | --- |
| `cmd` | `String` | The NatsScript command used to define this function. |
| `impl` | `Object` | The parsed command tree for this function. |

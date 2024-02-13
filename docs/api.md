# CompScript API reference

*This documentation was automatically generated on commit [99029e2](https://github.com/cubingusa/compscript/commit/99029e2) with `npm run gen-docs-api`, don't edit this file directly.*

## Index

  - [array](#array)
    - [MakeArray\<T>](#makearrayt)
    - [MakeEmptyArray](#makeemptyarray)
    - [In\<T>](#int)
    - [In](#in)
    - [In](#in-1)
    - [In](#in-2)
    - [Length\<T>](#lengtht)
    - [Map\<T, U>](#mapt-u)
    - [Filter\<T>](#filtert)
    - [Flatten\<T>](#flattent)
    - [Concat\<T>](#concatt)
    - [Sort\<ValType, SortType>](#sortvaltype-sorttype)
  - [boolean](#boolean)
    - [And](#and)
    - [Or](#or)
    - [Not](#not)
  - [cluster](#cluster)
    - [Cluster](#cluster)
    - [BalanceConstraint](#balanceconstraint)
    - [BalanceConstraint](#balanceconstraint-1)
    - [LimitConstraint](#limitconstraint)
    - [LimitConstraint](#limitconstraint-1)
  - [events](#events)
    - [Events](#events)
    - [Rounds](#rounds)
    - [EventId](#eventid)
    - [RoundId](#roundid)
    - [CompetingIn](#competingin)
    - [CompetingInRound](#competinginround)
    - [PositionInRound](#positioninround)
    - [RegisteredEvents](#registeredevents)
    - [PersonalBest](#personalbest)
    - [PsychSheetPosition](#psychsheetposition)
    - [RoundPosition](#roundposition)
    - [AddResults](#addresults)
    - [IsFinal](#isfinal)
    - [RoundNumber](#roundnumber)
    - [RoundForEvent](#roundforevent)
    - [EventForRound](#eventforround)
  - [groups](#groups)
    - [AssignGroups](#assigngroups)
    - [AssignmentSet](#assignmentset)
    - [ByMatchingValue\<T>](#bymatchingvaluet)
    - [ByFilters](#byfilters)
    - [StationAssignmentRule\<T>](#stationassignmentrulet)
    - [GroupNumber](#groupnumber)
    - [Stage](#stage)
    - [AssignedGroup](#assignedgroup)
    - [AssignedGroups](#assignedgroups)
    - [GroupName](#groupname)
    - [StartTime](#starttime)
    - [EndTime](#endtime)
    - [Date](#date)
    - [AssignmentAtTime](#assignmentattime)
    - [Code](#code)
    - [Group](#group)
    - [GroupForActivityId](#groupforactivityid)
    - [Round](#round)
    - [Event](#event)
    - [Groups](#groups)
    - [CreateGroups](#creategroups)
    - [ManuallyAssign](#manuallyassign)
    - [FixGroupNames](#fixgroupnames)
    - [CheckForMissingGroups](#checkformissinggroups)
    - [FixGroupNumbers](#fixgroupnumbers)
  - [help](#help)
    - [ListFunctions](#listfunctions)
    - [Help](#help)
  - [math](#math)
    - [GreaterThan\<T>](#greaterthant)
    - [GreaterThanOrEqualTo\<T>](#greaterthanorequaltot)
    - [EqualTo\<T>](#equaltot)
    - [EqualTo](#equalto)
    - [If\<T>](#ift)
    - [Add](#add)
    - [Add](#add-1)
    - [Add\<T>](#addt)
    - [Subtract](#subtract)
    - [Even](#even)
    - [Odd](#odd)
  - [persons](#persons)
    - [Name](#name)
    - [WcaId](#wcaid)
    - [WcaLink](#wcalink)
    - [CompetitionGroups](#competitiongroups)
    - [Registered](#registered)
    - [WcaIdYear](#wcaidyear)
    - [Email](#email)
    - [Country](#country)
    - [FirstName](#firstname)
    - [LastName](#lastname)
    - [BooleanProperty](#booleanproperty)
    - [StringProperty](#stringproperty)
    - [NumberProperty](#numberproperty)
    - [ArrayProperty](#arrayproperty)
    - [SetProperty\<T>](#setpropertyt)
    - [DeleteProperty](#deleteproperty)
    - [AddPerson](#addperson)
    - [Persons](#persons)
    - [AddRole](#addrole)
    - [DeleteRole](#deleterole)
    - [HasRole](#hasrole)
    - [RegistrationStatus](#registrationstatus)
    - [ClearAssignments](#clearassignments)
    - [HasResults](#hasresults)
    - [IsPossibleNoShow](#ispossiblenoshow)
    - [Gender](#gender)
  - [sheets](#sheets)
    - [ReadSpreadsheet](#readspreadsheet)
  - [staff](#staff)
    - [AssignStaff](#assignstaff)
    - [AssignMisc](#assignmisc)
    - [Job](#job)
    - [JobCountScorer](#jobcountscorer)
    - [PreferenceScorer](#preferencescorer)
    - [SameJobScorer](#samejobscorer)
    - [ConsecutiveJobScorer](#consecutivejobscorer)
    - [MismatchedStationScorer](#mismatchedstationscorer)
    - [ScrambleSpeedScorer](#scramblespeedscorer)
    - [GroupScorer](#groupscorer)
    - [FollowingGroupScorer](#followinggroupscorer)
    - [SetStaffUnavailable](#setstaffunavailable)
    - [UnavailableBetween](#unavailablebetween)
    - [UnavailableForDate](#unavailablefordate)
    - [BeforeTimes](#beforetimes)
    - [DuringTimes](#duringtimes)
    - [NumJobs](#numjobs)
  - [table](#table)
    - [Table\<ArgType, SortType>](#tableargtype-sorttype)
    - [Column\<T>](#columnt)
  - [time](#time)
    - [Time](#time)
    - [Hour](#hour)
  - [tuple](#tuple)
    - [Tuple\<T0>](#tuplet0)
    - [First\<T0>](#firstt0)
    - [Tuple\<T0, T1>](#tuplet0-t1)
    - [First\<T0, T1>](#firstt0-t1)
    - [Second\<T0, T1>](#secondt0-t1)
  - [udf](#udf)
    - [Define\<T>](#definet)
    - [Define\<T, U0>](#definet-u0)
    - [ListScripts](#listscripts)
  - [util](#util)
    - [Type\<T>](#typet)
    - [ClearCache](#clearcache)
    - [SetExtension\<T>](#setextensiont)
    - [SetGroupExtension\<T>](#setgroupextensiont)
    - [RenameAssignments](#renameassignments)
    - [AssignmentsBeforeCompeting](#assignmentsbeforecompeting)
    - [CreateAssignments](#createassignments)
    - [AssignmentReport](#assignmentreport)
    - [ToString\<T>](#tostringt)
    - [SwapAssignments](#swapassignments)
    - [DeleteAssignments](#deleteassignments)
  - [wcif](#wcif)
    - [ClearWCIF](#clearwcif)
    - [ExportWCIF](#exportwcif)
    - [ImportWCIF](#importwcif)

## array

TODO


### MakeArray\<T>

Makes an array containing the provided elements. Can be invoked as a literal expression via [vals].

  - Args:
    - *$T* **vals** *(can be null)(variadic)*

  - Returns: **Array\<$T>**

  - WCIF changes: **none**

### MakeEmptyArray

Constructs an array containing zero elements. Can be invoked as a literal expression via [].

  - Args: none

  - Returns: **Array\<Any>**

  - WCIF changes: **none**

### In\<T>

Returns whether the provided element is in the given array.

  - Args:
    - *$T* **value** *(can be null)(can be external)*
    - *Array\<$T>* **array**

  - Returns: **Boolean**

  - WCIF changes: **none**

### In

Returns whether the provided element is in the given array, overloaded for activity codes.

  - Args:
    - *Event* **value** *(can be null)(can be external)*
    - *Array\<Event>* **array**

  - Returns: **Boolean**

  - WCIF changes: **none**

### In

Returns whether the provided element is in the given array, overloaded for activity codes.

  - Args:
    - *Round* **value** *(can be null)(can be external)*
    - *Array\<Round>* **array**

  - Returns: **Boolean**

  - WCIF changes: **none**

### In

In, overloaded for DateTime.

  - Args:
    - *DateTime* **value** *(can be null)(can be external)*
    - *Array\<DateTime>* **array**

  - Returns: **Boolean**

  - WCIF changes: **none**

### Length\<T>

Returns the length of the provided array.

  - Args:
    - *Array\<$T>* **array**

  - Returns: **Number**

  - WCIF changes: **none**

### Map\<T, U>

Transforms the provided array using the provided function.

  - Args:
    - *Array\<$T>* **array**
    - *$U($T)* **operation** *(lazy evaluated)*

  - Returns: **Array\<$U>**

  - WCIF changes: **none**

### Filter\<T>

Filters an array to those satisfying a property.

  - Args:
    - *Array\<$T>* **array**
    - *Boolean($T)* **condition** *(lazy evaluated)*

  - Returns: **Array\<$T>**

  - WCIF changes: **none**

### Flatten\<T>

Flattens an array of arrays into a single array.

  - Args:
    - *Array\<Array<$T>>* **args**

  - Returns: **Array\<$T>**

  - WCIF changes: **none**

### Concat\<T>

Concatenates multiple arrays into a single array.

  - Args:
    - *Array\<$T>* **args** *(variadic)*

  - Returns: **Array\<$T>**

  - WCIF changes: **none**

### Sort\<ValType, SortType>

TODO

  - Args:
    - *Array\<$ValType>* **vals**
    - *$SortType($ValType)* **sortFns** *(variadic)(lazy evaluated)*

  - Returns: **Array\<$ValType>**

  - WCIF changes: **none**

## boolean

TODO


### And

Returns true if all of the provided arguments are true.

  - Args:
    - *Boolean* **param** *(variadic)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### Or

Returns true if any of the provided arguments are true.

  - Args:
    - *Boolean* **param** *(variadic)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### Not

Returns true if the provided argument is false.

  - Args:
    - *Boolean* **param**

  - Returns: **Boolean**

  - WCIF changes: **none**

## cluster

TODO


### Cluster

Arranges the provided Persons into clusters, and sets a property on each person to indicate which cluster they are in.

  - Args:
    - *String* **name**

      The name of the property where the result should be stored.
    - *Number* **numClusters**

      The number of clusters to create.
    - *Array\<Person>* **persons**

      The people to be clustered.
    - *String(Person)* **preCluster** *(lazy evaluated)*

      People with the same value for this function will be assigned to the same cluster.
    - *Array\<Constraint>* **constraints**

      Constraints that should be applied to the clustering.

  - Returns: **ClusteringResult**

  - WCIF changes: **persons**

### BalanceConstraint

A clustering constraint which balances the number of people in each Cluster with a given property, or the total of a given property.

  - Args:
    - *String* **name**

      The name of the constraint
    - *Number(Person)* **value** *(lazy evaluated)*

      The value of the constraint to be evaluated for each person
    - *Number* **weight**

      The weighting value to assign to this cluster

  - Returns: **Constraint**

  - WCIF changes: **none**

### BalanceConstraint

A clustering constraint which balances the number of people in each Cluster with a given property, or the total of a given property.

  - Args:
    - *String* **name**

      The name of the constraint
    - *Boolean(Person)* **value** *(lazy evaluated)*

      The value of the constraint to be evaluated for each person
    - *Number* **weight**

      The weighting value to assign to this cluster

  - Returns: **Constraint**

  - WCIF changes: **none**

### LimitConstraint

A constraint that limits the sum of a given property across all people in a cluster.

  - Args:
    - *String* **name**

      The name of the constraint
    - *Number(Person)* **value** *(lazy evaluated)*

      The value of the constraint to be evaluated for each person
    - *Number* **min**

      The minimum value per cluster
    - *Number* **weight**

      The weighting value to assign to this cluster

  - Returns: **Constraint**

  - WCIF changes: **none**

### LimitConstraint

A constraint that limits the sum of a given property across all people in a cluster.

  - Args:
    - *String* **name**

      The name of the constraint
    - *Boolean(Person)* **value** *(lazy evaluated)*

      The value of the constraint to be evaluated for each person
    - *Number* **min**

      The minimum value per cluster
    - *Number* **weight**

      The weighting value to assign to this cluster

  - Returns: **Constraint**

  - WCIF changes: **none**

## events

TODO


### Events

Returns a list of all events in a competition

  - Args: none

  - Returns: **Array\<Event>**

  - WCIF changes: **none**

### Rounds

Returns a list of all rounds in a competition

  - Args: none

  - Returns: **Array\<Round>**

  - WCIF changes: **none**

### EventId

Returns the string event ID for an event

  - Args:
    - *Event* **event** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### RoundId

Returns the ID for a round

  - Args:
    - *Round* **round** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### CompetingIn

Returns true if the specified person is competing in the specified event

  - Args:
    - *Event* **event** *(can be external)*
    - *Person* **person** *(can be external)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### CompetingInRound

Returns true if the specified person is competing in the specified round

  - Args:
    - *Round* **round** *(can be external)*
    - *Person* **person** *(can be external)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### PositionInRound

TODO

  - Args:
    - *Round* **round** *(can be external)*
    - *Person* **person** *(can be external)*

  - Returns: **Integer**

  - WCIF changes: **none**

### RegisteredEvents

Returns an array of events that the person is registered for

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **Array\<Event>**

  - WCIF changes: **none**

### PersonalBest

Returns the personal best for an event

  - Args:
    - *Event* **event** *(can be external)*
    - *String* **type**=default
    - *Person* **person** *(can be external)*

  - Returns: **AttemptResult**

  - WCIF changes: **none**

### PsychSheetPosition

Returns this person's position on the psych sheet for an event

  - Args:
    - *Event* **event** *(can be external)*
    - *String* **type**=default
    - *Person* **person** *(can be external)*

  - Returns: **Number**

  - WCIF changes: **none**

### RoundPosition

Returns this person's placement in a round that has already happened

  - Args:
    - *Round* **round**
    - *Person* **person** *(can be external)*

  - Returns: **Number**

  - WCIF changes: **none**

### AddResults

Add fake results for the given persons in the given round

  - Args:
    - *Round* **round**
    - *Array\<Person>* **persons**
    - *AttemptResult(Person)* **result**= *(lazy evaluated)*

  - Returns: **String**

  - WCIF changes: **events**

### IsFinal

Returns true if the provided round is a final

  - Args:
    - *Round* **round** *(can be external)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### RoundNumber

Returns the number of a round

  - Args:
    - *Round* **round**

  - Returns: **Number**

  - WCIF changes: **none**

### RoundForEvent

Returns a round for the specified event.

  - Args:
    - *Number* **number**
    - *Event* **event** *(can be external)*

  - Returns: **Round**

  - WCIF changes: **none**

### EventForRound

Returns the event for the round.

  - Args:
    - *Round* **round** *(can be external)*

  - Returns: **Event**

  - WCIF changes: **none**

## groups

TODO


### AssignGroups

Assigns groups for the given round

  - Args:
    - *Round* **round**

      The round to assign groups for
    - *Array\<AssignmentSet>* **assignmentSets**

      An ordered array of sets of people that should be evenly assigned
    - *Array\<AssignmentScorer>* **scorers**=

      A list of scoring functions to use
    - *Array\<StationAssignmentRule>* **stationRules**=

      Rules for assigning fixed stations
    - *Number* **attemptNumber**=null *(can be null)*

      If specified, assign groups for only this attempt number
    - *Boolean* **overwrite**=false

      If groups are already assigned, overwrite them

  - Returns: **GroupAssignmentResult**

  - WCIF changes: **persons, schedule**

### AssignmentSet

TODO

  - Args:
    - *String* **name**

      The name of this assignment set (for debug only)
    - *Boolean(Person)* **personFilter** *(lazy evaluated)*

      Which poeple are in this assignment set
    - *Boolean(Group)* **groupFilter** *(lazy evaluated)*

      Which groups can be assigned
    - *Boolean* **featured**=false

      Whether people in this assignment set should be marked as "featured" on their scorecard

  - Returns: **AssignmentSet**

  - WCIF changes: **none**

### ByMatchingValue\<T>

Score people based on how many people in each group match on a certain property

  - Args:
    - *$T(Person)* **value** *(lazy evaluated)*

      The property to consider
    - *Number* **score**

      The score to assign for each matching person

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### ByFilters

Score people based on whether the group satisfies a certain condition

  - Args:
    - *Boolean(Person)* **personFilter** *(lazy evaluated)*

      The people to consider for this scoring function
    - *Boolean(Group)* **groupFilter** *(lazy evaluated)*

      The groups to consider for this scoring function
    - *Number* **score**

      The score to assign if the person and group satisfy the filter

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### StationAssignmentRule\<T>

A rule to assign people to stations

  - Args:
    - *Boolean(Group)* **groupFilter** *(lazy evaluated)*

      The groups for which this should apply
    - *String* **mode**

      The station assignment mode to use, either "ascending", "descending", or "arbitrary"
    - *$T(Person)* **sortKey**=0 *(lazy evaluated)*

      If "mode" is either "ascending" or "descending", the sort key to use

  - Returns: **StationAssignmentRule**

  - WCIF changes: **none**

### GroupNumber

The number of a group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **Number**

  - WCIF changes: **none**

### Stage

The stage name for a group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### AssignedGroup

A person's assigned group for a round

  - Args:
    - *Round* **round** *(can be external)*
    - *Person* **person** *(can be external)*

  - Returns: **Group**

  - WCIF changes: **none**

### AssignedGroups

All of a person's assigned groups

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **Array\<Group>**

  - WCIF changes: **none**

### GroupName

The full name of a group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### StartTime

The start time of a group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **DateTime**

  - WCIF changes: **none**

### EndTime

The end time of a group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **DateTime**

  - WCIF changes: **none**

### Date

The date of a group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **Date**

  - WCIF changes: **none**

### AssignmentAtTime

The assignment that a person has at a particular time

  - Args:
    - *DateTime* **time**
    - *Person* **person** *(can be external)*

  - Returns: **Assignment**

  - WCIF changes: **none**

### Code

The AssignmentCode for an Assignment

  - Args:
    - *Assignment* **assignment**

  - Returns: **String**

  - WCIF changes: **none**

### Group

The Group for an Assignment

  - Args:
    - *Assignment* **assignment**

  - Returns: **Group**

  - WCIF changes: **none**

### GroupForActivityId

Returns the group with the specified id

  - Args:
    - *Number* **id**

  - Returns: **Group**

  - WCIF changes: **none**

### Round

The Round for a Group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **Round**

  - WCIF changes: **none**

### Event

The Event for a Group

  - Args:
    - *Group* **group** *(can be external)*

  - Returns: **Event**

  - WCIF changes: **none**

### Groups

All groups in a round

  - Args:
    - *Round* **round** *(can be external)*

  - Returns: **Array\<Group>**

  - WCIF changes: **none**

### CreateGroups

Inserts groups into the schudle.

  - Args:
    - *Round* **round**
    - *Number* **count**
    - *String* **stage**
    - *DateTime* **start**
    - *DateTime* **end**

  - Returns: **Array\<String>**

  - WCIF changes: **schedule**

### ManuallyAssign

Manually assign the provided competitors to the provided groups.

  - Args:
    - *Array\<Person>* **persons**
    - *Round* **round**
    - *String* **stage**
    - *Number* **number**

  - Returns: **String**

  - WCIF changes: **persons**

### FixGroupNames

TODO

  - Args: none

  - Returns: **Array\<String>**

  - WCIF changes: **schedule**

### CheckForMissingGroups

TODO

  - Args: none

  - Returns: **Array\<String>**

  - WCIF changes: **none**

### FixGroupNumbers

TODO

  - Args: none

  - Returns: **Array\<String>**

  - WCIF changes: **schedule**

## help

TODO


### ListFunctions

Provide a list of all functions

  - Args: none

  - Returns: **ListFunctionsOutput**

  - WCIF changes: **none**

### Help

Provide documentation about a single function

  - Args:
    - *String* **functionName**

  - Returns: **FunctionHelp**

  - WCIF changes: **none**

## math

TODO


### GreaterThan\<T>

Return true if val1 > val2 (maybe invoked with ">")

  - Args:
    - *$T* **val1** *(can be null)*
    - *$T* **val2** *(can be null)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### GreaterThanOrEqualTo\<T>

Return true if val1 >= val2 (maybe invoked with ">=")

  - Args:
    - *$T* **val1** *(can be null)*
    - *$T* **val2** *(can be null)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### EqualTo\<T>

Return true if val1 == val2 (maybe invoked with "==")

  - Args:
    - *$T* **val1** *(can be null)*
    - *$T* **val2** *(can be null)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### EqualTo

Override of EqualTo for Date objects

  - Args:
    - *Date* **val1** *(can be null)*
    - *Date* **val2** *(can be null)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### If\<T>

If the condition is true, return the first value, else the second value

  - Args:
    - *Boolean* **condition**
    - *$T* **ifTrue** *(can be null)*
    - *$T* **ifFalse** *(can be null)*

  - Returns: **$T**

  - WCIF changes: **none**

### Add

Adds two numbers (may be invoked with "+")

  - Args:
    - *Number* **val1**
    - *Number* **val2**

  - Returns: **Number**

  - WCIF changes: **none**

### Add

Concatenates two strings (may be invoked with "+")

  - Args:
    - *String* **val1** *(can be null)*
    - *String* **val2** *(can be null)*

  - Returns: **String**

  - WCIF changes: **none**

### Add\<T>

Concatenates two arrays (may be invoked with "+")

  - Args:
    - *Array\<$T>* **array1**
    - *Array\<$T>* **array2**

  - Returns: **Array\<$T>**

  - WCIF changes: **none**

### Subtract

Subtracts two numbers (may be invoked with "-")

  - Args:
    - *Number* **val1**
    - *Number* **val2**

  - Returns: **Number**

  - WCIF changes: **none**

### Even

Returns true if the number is even

  - Args:
    - *Number* **val** *(can be null)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### Odd

Returns true if the number is odd

  - Args:
    - *Number* **val** *(can be null)*

  - Returns: **Boolean**

  - WCIF changes: **none**

## persons

TODO


### Name

Returns the person's name

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### WcaId

Returns the person's WCA ID

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### WcaLink

Returns a link to the person's WCA profile

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### CompetitionGroups

Returns a link to competitiongroups.com for the person

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### Registered

Returns true if the person is registered for the competition

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### WcaIdYear

Returns the year component of the person's WCA ID

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **Number**

  - WCIF changes: **none**

### Email

Returns the person's email

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### Country

Returns the person's country

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### FirstName

Returns the person's first name

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### LastName

Returns the person's last name

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### BooleanProperty

Gets a property attached to the person's WCIF

  - Args:
    - *String* **name**
    - *Person* **person** *(can be external)*
    - *Boolean* **defaultValue**=false

  - Returns: **Boolean**

  - WCIF changes: **none**

### StringProperty

Gets a property attached to the person's WCIF

  - Args:
    - *String* **name**
    - *Person* **person** *(can be external)*
    - *String* **defaultValue**=

  - Returns: **String**

  - WCIF changes: **none**

### NumberProperty

Gets a property attached to the person's WCIF

  - Args:
    - *String* **name**
    - *Person* **person** *(can be external)*
    - *Number* **defaultValue**=0

  - Returns: **Number**

  - WCIF changes: **none**

### ArrayProperty

Gets a property attached to the person's WCIF

  - Args:
    - *String* **name**
    - *Person* **person** *(can be external)*
    - *Array\<String>* **defaultValue**=

  - Returns: **Array\<String>**

  - WCIF changes: **none**

### SetProperty\<T>

Sets the given property on the provided people

  - Args:
    - *Array\<Person>* **persons**
    - *String* **property**
    - *$T(Person)* **value** *(lazy evaluated)*

  - Returns: **String**

  - WCIF changes: **persons**

### DeleteProperty

Deletes the given property on the provided people

  - Args:
    - *Array\<Person>* **persons**
    - *String* **property**

  - Returns: **String**

  - WCIF changes: **persons**

### AddPerson

Adds the given person as a staff member

  - Args:
    - *Number* **wcaUserId**

  - Returns: **String**

  - WCIF changes: **persons**

### Persons

Returns all persons matching a property

  - Args:
    - *Boolean(Person)* **filter** *(lazy evaluated)*

  - Returns: **Array\<Person>**

  - WCIF changes: **none**

### AddRole

Adds the provided Role to the given people

  - Args:
    - *Array\<Person>* **persons**
    - *String* **role**

  - Returns: **String**

  - WCIF changes: **persons**

### DeleteRole

Deletes the provided Role from the given people

  - Args:
    - *Array\<Person>* **persons**
    - *String* **role**

  - Returns: **String**

  - WCIF changes: **persons**

### HasRole

Returns whether the given person has the given role

  - Args:
    - *Person* **person** *(can be external)*
    - *String* **role**

  - Returns: **Boolean**

  - WCIF changes: **none**

### RegistrationStatus

Returns the registration.status field in WCIF.

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

### ClearAssignments

Clears assignments.

  - Args:
    - *Array\<Person>* **persons**
    - *Boolean* **clearStaff**
    - *Boolean* **clearGroups**

  - Returns: **String**

  - WCIF changes: **persons**

### HasResults

Returns true if the person appears in the results

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### IsPossibleNoShow

Returns true if the competitor has not competed and has missed at least one event

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **Boolean**

  - WCIF changes: **none**

### Gender

TODO

  - Args:
    - *Person* **person** *(can be external)*

  - Returns: **String**

  - WCIF changes: **none**

## sheets

TODO


### ReadSpreadsheet

Reads data from the provided Google Sheet

  - Args:
    - *String* **spreadsheetId**

  - Returns: **ReadSpreadsheetResult**

  - WCIF changes: **persons**

## staff

TODO


### AssignStaff

TODO

  - Args:
    - *Round* **round**
    - *Boolean(Group)* **groupFilter** *(lazy evaluated)*
    - *Array\<Person>* **persons**
    - *Array\<AssignmentJob>* **jobs**
    - *Array\<AssignmentScorer>* **scorers**
    - *Boolean* **overwrite**=false
    - *Boolean* **avoidConflicts**=true

  - Returns: **StaffAssignmentResult**

  - WCIF changes: **persons**

### AssignMisc

TODO

  - Args:
    - *Number* **activityId**
    - *Array\<Person>* **persons**
    - *Array\<AssignmentJob>* **jobs**
    - *Array\<AssignmentScorer>* **scorers**
    - *Boolean* **overwrite**=false
    - *Boolean* **avoidConflicts**=true

  - Returns: **StaffAssignmentResult**

  - WCIF changes: **persons**

### Job

TODO

  - Args:
    - *String* **name**
    - *Number* **count**
    - *Boolean* **assignStations**=false
    - *Boolean(Person)* **eligibility**=true *(lazy evaluated)*

  - Returns: **AssignmentJob**

  - WCIF changes: **none**

### JobCountScorer

TODO

  - Args:
    - *Number* **weight**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### PreferenceScorer

TODO

  - Args:
    - *Number* **weight**
    - *String* **prefix**
    - *Number* **prior**
    - *Array\<String>* **allJobs**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### SameJobScorer

TODO

  - Args:
    - *Number* **center**
    - *Number* **posWeight**
    - *Number* **negWeight**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### ConsecutiveJobScorer

TODO

  - Args:
    - *Number* **center**
    - *Number* **posWeight**
    - *Number* **negWeight**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### MismatchedStationScorer

TODO

  - Args:
    - *Number* **weight**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### ScrambleSpeedScorer

TODO

  - Args:
    - *Event* **event**
    - *AttemptResult* **maxTime**
    - *Number* **weight**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### GroupScorer

TODO

  - Args:
    - *Boolean(Person, Group)* **condition** *(lazy evaluated)*
    - *Number* **weight**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### FollowingGroupScorer

TODO

  - Args:
    - *Number* **weight**

  - Returns: **AssignmentScorer**

  - WCIF changes: **none**

### SetStaffUnavailable

Marks the provided staff members as unavailable at the given time

  - Args:
    - *Array\<Person>* **persons**
    - *Array\<StaffUnavailability>* **times**

  - Returns: **String**

  - WCIF changes: **persons**

### UnavailableBetween

Indicates that the staff member is unavailable at the given time

  - Args:
    - *DateTime* **start**
    - *DateTime* **end**

  - Returns: **StaffUnavailability**

  - WCIF changes: **none**

### UnavailableForDate

Indicates that the staff member is unavailable on the given date

  - Args:
    - *Date* **date**

  - Returns: **StaffUnavailability**

  - WCIF changes: **none**

### BeforeTimes

Indicates the staff member is unavailable during groups that end in the provided times

  - Args:
    - *Array\<DateTime>* **times**

  - Returns: **StaffUnavailability**

  - WCIF changes: **none**

### DuringTimes

Indicates the staff member is unavailable during groups that start in the provided times

  - Args:
    - *Array\<DateTime>* **times**

  - Returns: **StaffUnavailability**

  - WCIF changes: **none**

### NumJobs

The number of jobs for a given person. If type is not provided, all jobs are included.

  - Args:
    - *Person* **person** *(can be external)*
    - *String* **type**=null *(can be null)*

  - Returns: **Number**

  - WCIF changes: **none**

## table

TODO


### Table\<ArgType, SortType>

TODO

  - Args:
    - *Array\<$ArgType>* **keys**
    - *Array\<Column>($ArgType)* **columns** *(lazy evaluated)*

  - Returns: **Table**

  - WCIF changes: **none**

### Column\<T>

TODO

  - Args:
    - *String* **title**
    - *$T* **value** *(can be null)*
    - *String* **link**=null *(can be null)*

  - Returns: **Column**

  - WCIF changes: **none**

## time

TODO


### Time

TODO

  - Args:
    - *DateTime* **time**

  - Returns: **String**

  - WCIF changes: **none**

### Hour

TODO

  - Args:
    - *DateTime* **time**

  - Returns: **Number**

  - WCIF changes: **none**

## tuple

TODO


### Tuple\<T0>

TODO

  - Args:
    - *$T0* **arg_T0**

  - Returns: **Tuple\<$T0>**

  - WCIF changes: **none**

### First\<T0>

TODO

  - Args:
    - *Tuple\<$T0>* **tuple** *(can be external)*

  - Returns: **$T0**

  - WCIF changes: **none**

### Tuple\<T0, T1>

TODO

  - Args:
    - *$T0* **arg_T0**
    - *$T1* **arg_T1**

  - Returns: **Tuple\<$T0, $T1>**

  - WCIF changes: **none**

### First\<T0, T1>

TODO

  - Args:
    - *Tuple\<$T0, $T1>* **tuple** *(can be external)*

  - Returns: **$T0**

  - WCIF changes: **none**

### Second\<T0, T1>

TODO

  - Args:
    - *Tuple\<$T0, $T1>* **tuple** *(can be external)*

  - Returns: **$T1**

  - WCIF changes: **none**

## udf

TODO


### Define\<T>

TODO

  - Args:
    - *String* **name**
    - *$T()* **implementation**
    - *Boolean* **public**=false

  - Returns: **Void**

  - WCIF changes: **none**

### Define\<T, U0>

TODO

  - Args:
    - *String* **name**
    - *$T($U0)* **implementation**
    - *Boolean* **public**=false

  - Returns: **Void**

  - WCIF changes: **none**

### ListScripts

TODO

  - Args: none

  - Returns: **ListScriptsOutput**

  - WCIF changes: **none**

## util

TODO


### Type\<T>

TODO

  - Args:
    - *$T* **arg**

  - Returns: **String**

  - WCIF changes: **none**

### ClearCache

TODO

  - Args: none

  - Returns: **String**

  - WCIF changes: **none**

### SetExtension\<T>

Sets a property in a competition-level extension.

  - Args:
    - *String* **property**
    - *$T* **value**
    - *String* **type**
    - *String* **namespace**=org.cubingusa.natshelper.v1

  - Returns: **String**

  - WCIF changes: **extensions**

### SetGroupExtension\<T>

Sets a property in a group extension.

  - Args:
    - *String* **property**
    - *$T* **value**
    - *String* **type**
    - *Group* **group** *(can be external)*
    - *String* **namespace**=org.cubingusa.natshelper.v1

  - Returns: **String**

  - WCIF changes: **schedule**

### RenameAssignments

TODO

  - Args: none

  - Returns: **String**

  - WCIF changes: **persons**

### AssignmentsBeforeCompeting

TODO

  - Args:
    - *Array\<Person>* **persons**

  - Returns: **Array\<String>**

  - WCIF changes: **none**

### CreateAssignments

TODO

  - Args:
    - *Array\<Person>* **persons**
    - *Number* **activityId**
    - *String* **assignmentCode**

  - Returns: **String**

  - WCIF changes: **persons**

### AssignmentReport

TODO

  - Args:
    - *Array\<Person>* **persons**
    - *Array\<Group>* **groups**
    - *String* **label**

  - Returns: **Multi**

  - WCIF changes: **none**

### ToString\<T>

TODO

  - Args:
    - *$T* **arg**

  - Returns: **String**

  - WCIF changes: **none**

### SwapAssignments

TODO

  - Args:
    - *Person* **person1**
    - *Person* **person2**
    - *Array\<Group>* **groups**

  - Returns: **String**

  - WCIF changes: **persons**

### DeleteAssignments

TODO

  - Args:
    - *Person* **person**
    - *Array\<Group>* **groups**

  - Returns: **String**

  - WCIF changes: **persons**

## wcif

This category gathers all functions regarding high level WCIF manipulation


### ClearWCIF

Remove all childActivities keeping only the main schedule, remove all assignments, cleanup roles, cleanup NatsHelper extension data.

  - Args:
    - *Boolean* **clearExternalExtensions**=false

      Also cleanup external tools extensions.

  - Returns: **Void**

  - WCIF changes: **schedule, persons**

### ExportWCIF

Export the WCIF to a json file

  - Args:
    - *String* **filename**=wcif.json

      WCIF filename (emitted in WCIF_DATA_FOLDER/competitionId)

  - Returns: **String**

  - WCIF changes: **none**

### ImportWCIF

Import the WCIF from a json file

  - Args:
    - *String* **filename**

      WCIF filename (relative to WCIF_DATA_FOLDER/competitionId)

  - Returns: **String**

  - WCIF changes: **none**


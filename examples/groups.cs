# CompScript Groups and Staff Assignment Examples

# Get all groups for an event
Groups(_333-r1)

# Count groups
Length(Groups(_333-r1))

# Assign groups using constraints
AssignGroups(
  _333-r1,
  [
    # Constraint examples would go here
  ]
)

# Get staff assignments
StaffAssignments(_333-r1-g1)

# Define a function to check if someone is available
Define(
  "IsAvailable",
  Not(StaffUnavailable({1, Person}, {2, Group}))
)

# Filter available people for a specific group
Filter(
  Persons(Registered()),
  IsAvailable(_333-r1-g1)
)

# Count events per person
Define(
  "NumEvents",
  Length(RegisteredEvents())
)

# Show people sorted by number of events
Table(
  Sort(Persons(Registered()), NumEvents()),
  [
    Column("Name", Name()),
    Column("Events", NumEvents())
  ]
)

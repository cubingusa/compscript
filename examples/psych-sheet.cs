# CompScript Psych Sheet Example
# This creates a ranking table for an event

# Luke psych sheet
Table(
  Sort(
    Persons(And(Registered(), (FirstName() == "Luke"))),
    PersonalBest(_333, "average")
  ),
  [
    Column("Name", Name()),
    Column("WCA ID", WcaId(), WcaLink()),
    Column("Average", PersonalBest(_333)),
    Column("Single", PersonalBest(_333, "single")),
    Column("Ranking", PsychSheetPosition(_333))
  ]
)

# Top 10 competitors for 3x3
Table(
  Take(
    Sort(
      Persons(Registered()),
      PersonalBest(_333, "average")
    ),
    10
  ),
  [
    Column("Rank", Index()),
    Column("Name", Name()),
    Column("Country", Country()),
    Column("Average", PersonalBest(_333, "average")),
    Column("Single", PersonalBest(_333, "single"))
  ]
)

# Define a custom function for sum of rankings
Define(
  "SumOfRankings",
  (PsychSheetPosition({1, Event}, "average") + PsychSheetPosition({1, Event}, "single"))
)

# Use the custom function
Table(
  Sort(
    Persons(Registered()),
    SumOfRankings(_333)
  ),
  [
    Column("Name", Name()),
    Column("Sum of Rankings", SumOfRankings(_333))
  ]
)

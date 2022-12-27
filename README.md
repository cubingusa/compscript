# natshelper

natshelper is a tool for assigning groups and staff assignments for WCA Rubik's Cube competitions. Other similar tools include [Groupifier](https://github.com/jonatanklosko/groupifier), [AGE](https://github.com/Goosly/AGE), and [Delegate Dashboard](https://github.com/coder13/delegateDashboard). Those tools are intended to be user-friendly, automated systems that give you a few configuration options, let you click a button to generate all assignments, then allow for fine-tuning. This is a power-user tool -- it is designed for competitions where the organizer would consider spending multiple hours assigning groups, due to complicated constraints like multiple stages, dedicated staff, a live stream, and a desire to have a large amount of control over how groups should be assigned. Competitions with up to ~200 competitors and only one stage are likely served better by another tool.

natshelper is designed primarily for CubingUSA Nationals. Requirements for other competitions may not be prioritized.

## Running

Node must be installed on your machine.

```
$ npm install
$ node main.js
```

Currently this uses a dev WCA environment running on the same machine. https://github.com/timreyn/natshelper/issues/13 to support staging and prod.

## Schedule

You can edit the competition schedule and create groups on the schedule editor page.

The assumption is that there are many stages, and each stage has the same events going at (roughly) the same time. If one stage needs to start 1 group later, this can be set for that stage by setting the group config `+1`. If a stage needs to end an event 2 groups early, this is denoted as `-2`.

## Scripts

You can enter scripts in the script box, using a custom language called natsscript. There are a variety of commands, defined in the `functions` directory in this repository.

Some examples:

The Luke psych sheet
```
Table(
  And(Registered(), (FirstName() == "Luke")),
  [Column("Name", Name()),
   Column("WCA ID", WcaId(), WcaLink()),
   Column("Average", PersonalBest(_333)),
   Column("Single", PersonalBest(_333, "single")),
   Column("psych sheet ranking", PsychSheetRanking(_333))],
  PersonalBest(_333, "average"))
```

Defining a custom function
```
Define(
  "SumOfRankings",
  (PsychSheetPosition(<1, Activity>, "average") + PsychSheetPosition(<1, Activity>, "single")))
```
which can then be called by:
```
SumOfRankings(_333)
```

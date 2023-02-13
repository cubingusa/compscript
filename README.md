# natshelper

natshelper is a tool for assigning groups and staff assignments for WCA Rubik's Cube competitions. Other similar tools include [Groupifier](https://github.com/jonatanklosko/groupifier), [AGE](https://github.com/Goosly/AGE), and [Delegate Dashboard](https://github.com/coder13/delegateDashboard). Those tools are intended to be user-friendly, automated systems that give you a few configuration options, let you click a button to generate all assignments, then allow for fine-tuning. This is a power-user tool -- it is designed for competitions where the organizer would consider spending multiple hours assigning groups, due to complicated constraints like multiple stages, dedicated staff, a live stream, and a desire to have a large amount of control over how groups should be assigned. Competitions with up to ~200 competitors and only one stage are likely served better by another tool.

natshelper is designed primarily for CubingUSA Nationals. Requirements for other competitions may not be prioritized.

## Running

Node must be installed on your machine.

```
$ npm install
$ ENV=DEV node main.js
```

`ENV=DEV` uses a dev WCA environment running on the same machine. If you would like to use the production WCA site, you need to:

1. Make an OAuth application [here](https://www.worldcubeassociation.org/oauth/applications). For "Scopes", use `public manage_competitions`; for "Callback Urls" use `http://localhost:3033/auth/oauth_response`.
2. Make a copy of the `.env.DEV` file, such as `.env.PROD`. This file should not be committed; `.gitignore` should ignore it.
3. Replace `WCA_HOST`, `API_KEY`, and `API_SECRET` with the production values. You should also consider changing the `COOKIE_SECRET` to a new value, and to change `PORT` to 3033 to distinguish from the dev version.
4. Run with `$ ENV=PROD node main.js`, using the file suffix you used above.

## Schedule

You can edit the competition schedule and create groups on the schedule editor page.

The assumption is that there are many stages, and each stage has the same events going at (roughly) the same time. If one stage needs to start 1 group later, this can be set for that stage by setting the group config `+1`. If a stage needs to end an event 2 groups early, this is denoted as `-2`.

## Scripts

You can enter scripts in the script box, using a custom language called natsscript. There are a variety of commands, defined in the `functions` directory in this repository.

Some examples:

The Luke psych sheet
```
Table(
  Persons(And(Registered(), (FirstName() == "Luke"))),
  [Column("Name", Name()),
   Column("WCA ID", WcaId(), WcaLink()),
   Column("Average", PersonalBest(_333)),
   Column("Single", PersonalBest(_333, "single")),
   Column("psych sheet ranking", PsychSheetPosition(_333))],
  PersonalBest(_333, "average"))
```

Defining a custom function
```
Define(
  "SumOfRankings",
  (PsychSheetPosition(<1, Event>, "average") + PsychSheetPosition(<1, Event>, "single")))
```
which can then be called by:
```
SumOfRankings(_333)
```

## Google Sheets integration

We use the google-spreadsheets NPM package to read from Google Sheets. Please refer to [this page](https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication) for how to create a Service Account with Google Sheets access. Move the generated JSON file to `google-credentials.json` in the top-level project directory, and make sure to grant the service account access to the spreadsheet you'd like it to read.

Do not share the service account credentials with anyone who should not have access to the spreadsheets you'd like to read.

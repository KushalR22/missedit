// samples.js
// ---------------------------------------------------------------------------
// Realistic sample conversations. These are INPUTS the user can load to try the
// app — the AI still analyzes them live. They are NOT pre-written results, so
// the "no mock data" rule is respected: every sample is run through Gemini.
// ---------------------------------------------------------------------------

export const SAMPLES = {
  workgroup: {
    name: "Priya",
    text: `Arjun: Morning team! Quick heads up — standup is moved to 10:00 AM tomorrow instead of 9:30.
Meera: Noted. I'll be 5 min late, dentist.
Arjun: @Priya can you share the Q3 slides before standup? The client wants them by EOD Friday.
Sanjay: Also we decided to go with the Postgres option, not Mongo. Finalized in the arch call.
Meera: Great. Who's updating the migration doc?
Arjun: Priya, can you own that too? Deadline is next Wednesday.
Sanjay: Reminder: expense reports due by Oct 15, finance will not accept late ones.
Rahul: Has anyone looked at the failing CI pipeline? It's been red since yesterday.
Arjun: @Priya you pushed last, can you take a look when you're free?
Meera: FYI the office wifi will be down Saturday 2-4pm for maintenance.`,
  },

  project: {
    name: "You",
    text: `Client (Nalini): Hi team, we need the beta build ready for the demo on Monday Oct 13, 11 AM sharp.
PM (Dev): Got it. @you please confirm the payment module will be done by Friday.
PM (Dev): We also agreed to drop the dark-mode feature from this release to hit the deadline.
Designer (Kiran): Final mockups are in Figma, link in the channel. Please review by Thursday.
Client (Nalini): One more thing — the login page must support Google sign-in, that's a hard requirement.
QA (Sam): I found 2 blocker bugs in checkout. Logged them as BUG-114 and BUG-115.
PM (Dev): @you those two bugs are yours since you wrote checkout. Need fixes before Friday freeze.
PM (Dev): Decision: we ship to staging Friday 6 PM, no commits after that.
Kiran: Reminder the brand colors changed — use #0b7d5a as the new primary everywhere.`,
  },

  family: {
    name: "You",
    text: `Mom: Don't forget your cousin's wedding is on the 18th, we leave at 7 AM.
Dad: @you did you book the train tickets yet? They're filling up fast.
Sister: I'll handle the gift. Everyone send me 500 each by Sunday.
Mom: Grandma's doctor appointment got moved to Tuesday 4 PM, someone needs to take her.
Dad: Can you take her? I have a meeting.
Uncle: Family lunch this Saturday at 1 at the usual place, please confirm numbers.
Sister: Also the house painting starts Monday, we all need to move stuff out of our rooms Sunday night.
Mom: @you please call the electrician, the geyser is leaking again.`,
  },
};

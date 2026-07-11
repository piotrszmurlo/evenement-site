# Unit embed prototype — NOTES

## Question

The unit detail page (`/inwestycje/[investment]/[unit]/`) feels useless. Should we remove it and embed **description** + **price history** on the investment page instead? If yes, which structure?

## Variants (dev only)

Host: `/inwestycje/sloneczna-polana-iv/?variant=A` (or B / C)

| Key | Name | Idea |
|-----|------|------|
| A | Expandable rows | Keep the comparison table; expand a row for description + price history |
| B | Side sheet | Lean clickable table; hint above; row opens slide-over |
| C | Unit dossiers | Drop the table; each unit is a full section with prose + timeline |

## Verdict

**B wins** (side sheet), with tweaks:
- Whole row clickable (hover affordance)
- Hint above the table: click row for description + price history
- No Szczegóły button

_Still prototype — fold into production when ready._

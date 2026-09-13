# The screens to build now, and the rules that make them consistent

For Denis and Jordan. Read this before writing a component — most of what
follows exists to stop you rebuilding something that is already there.

---

## 1. What is already done

**The frame is finished.** Do not rebuild any of it:

- Sign-in, including the two-step code and email confirmation
- Token refresh, and the rule that a dead server never signs a user out
- The sidebar, filtered by what the signed-in role may actually reach
- The warehouse switcher, shared by every screen through one provider
- Dashboard, Reports, Orders, Receiving, Production Orders, Shipments,
  Schools, Warehouses, Tailoring Centers

**The API layer is finished.** Every endpoint in the system has a typed
function in `src/api/` and a query key in `src/api/keys.ts`. You should not
be writing `fetch`, and you should not be hand-writing a request or response
type — they come from `/api/schema/` via `npm run gen:api`.

## 2. What to build

Four screens, all in **Inventory & Products**, all currently showing a
placeholder. They are the tables everything else stands on: a production
order needs SKUs, a SKU needs a garment, an order needs a price.

| Screen | Path | API |
|---|---|---|
| **Garments** | `/garments` | `catalog.garments` — leads only (F05) |
| **SKUs** | `/skus` | `catalog.skus` — everyone reads |
| **Pricing** | `/pricing` | `catalog.prices`, `price-lists` |
| **Stock History** | `/stock-history` | `inventory.movements` |

Each is a list, a filter bar, and a create/edit modal — the same shape as
Schools and Warehouses, which are built and worth copying *the structure*
of, not the class names.

**Garments and SKUs also need an import path.** AsOne is sending the
catalogue as a spreadsheet — about 45 garments and 200 SKUs — so the screen
has to offer "import a file" alongside "add one". The server command is
`import_catalog`; an upload endpoint will follow. Build the screen expecting
both.

## 3. Use what exists

```
src/components/    24 shared components — one import
src/styles/tokens.css   every size, colour, space, weight
src/domain/        money, dates, access, status — shared logic
src/api/           one typed module per resource
```

**The rule: reach for the shared thing first. If it does not fit, change the
shared thing — never write a near-copy.**

Four bugs last week all came from breaking it, and each looked like
carelessness when it was the same habit:

```
.schools-page-head__title   a copy of .page-head__title that lost its colour
.school-detail-header       a second copy, used on the warehouse page
.hub-panel                  a third panel implementation
schools-modal-btn-*         the modal's buttons, used on a warehouse card
```

**If you are about to write a class name beginning with your screen's name,
stop.** That is the signal you are copying something shared.

## 4. Type and colour

Ten tokens, one per role. **Never write `font-size: 18px`.**

```
--text-display   big figures, sign-in title
--text-h1        page titles
--text-h2        section headings, compact figures
--text-subhead   card titles
--text-h3        panel titles, sub-headings
--text-body      prose, inputs, labels
--text-small     dense tables
--text-caption   secondary detail
--text-overline  uppercase eyebrows
--text-micro     tags, badges
```

Pick by **what the text is**, not how big it should look. Same for colour:
`var(--text-primary)`, `var(--accent)`, `var(--border)`. There are zero raw
`px` font sizes and almost no raw hexes left outside `tokens.css` — keep it
that way.

## 5. Long text, and lots of it

Both have already bitten us. Decide which of two treatments applies:

**A row in a list truncates.** It has a fixed height and something to its
right — a badge, a figure — that must not be pushed out.

```css
.row__left   { min-width: 0; }        /* or the child cannot shrink */
.row__title  { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge       { flex-shrink: 0; }      /* nowrap alone is not enough */
```

`min-width: 0` is the one everybody forgets. A flex child will not shrink
below its content without it, and a long school name shoves the status badge
off the card.

**A heading or an address wraps.** `overflow-wrap: anywhere`. A title cut
mid-word tells the reader less than a title on two lines.

**And a list with many items does not grow forever.** Cap it and offer the
rest — `Panel` takes a `viewAll` for exactly this, and the hub panels show
six rows with "View all N".

## 6. Before you push

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

All four, every time. Then open a pull request against `main` — never push
to `main` directly — and assign it for review.

**No `Co-Authored-By` trailers in commit messages.** They list Claude in the
repository's Contributors, and this is client work.

## 7. When to stop and ask

- The design shows data the API does not return. Say so rather than
  inventing a field — there is no "assignee" on an order, and a screen that
  implies one is a promise the system cannot keep.
- The design shows something already built differently. The built thing is
  usually right; check before rebuilding.
- Anything about releasing, paying for, or shipping an order — several of
  those are still open questions with AsOne.

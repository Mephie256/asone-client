/**
 * What each screen means — the content behind the Help button.
 *
 * Written because this system has rules nobody guesses from the interface.
 * An order cannot be picked before Finance confirms payment; the stock
 * ledger is append-only so nothing is ever edited, only offset; a van goes
 * to a school rather than to an order. A clerk who does not know those will
 * read a refusal as a bug.
 *
 * Plain data, no React, so the wording can be reviewed by somebody who does
 * not read code — and so it can be handed to AsOne to correct. Everything
 * here describes behaviour that exists today; where a thing is deliberately
 * not built, it says so rather than staying silent.
 */

export interface HelpTopic {
  /** Route prefix this covers. Longest match wins, so detail beats list. */
  path: string
  title: string
  /** One idea per entry. Kept short — this is read standing up. */
  points: string[]
}

export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    path: '/dashboard',
    title: 'Dashboard',
    points: [
      'Every figure here is the same number the screen behind it shows. If a tile and a report disagree, the report is right and the tile has a bug worth reporting.',
      'The warehouse selector at the top changes every figure on the page. "All warehouses" is the whole country; a warehouse clerk is pinned to their own site and is not offered the choice.',
      'Needs Attention only lists things somebody can act on today. An empty list means there is genuinely nothing waiting.',
    ],
  },
  {
    path: '/orders',
    title: 'School orders',
    points: [
      'An order is placed by the school and is its invoice — the number on screen is the number the parent was given. Orders are never deleted, only cancelled, because that number is already out in the world.',
      'A new order sits on Hold until payment is confirmed. Confirming payment is what releases it to the warehouse, so there is no separate "paid" step to tick.',
      'Only school staff place, amend or cancel an order. Finance confirms payment. The warehouse picks and ships. Each of those is a different person, and the buttons you see depend on which you are.',
      'Cancelling is only possible while the order is unpaid. After that, what happens to picked stock and money already taken is a question AsOne has not answered, so the system refuses rather than guessing.',
    ],
  },
  {
    path: '/shipments',
    title: 'Shipping and picking',
    points: [
      'Picking reserves stock. The moment you pick an order, those garments stop being available to any other school — which is why a wrong pick can make the next order look short when it is not.',
      'A pick is all or nothing. There is no half-picked state, because a partial reservation would let the ledger claim stock is committed to an order nobody finished. If you picked the wrong order, use Undo on the order itself; it puts the stock back and records why.',
      'Despatch is per school, not per order. One van carries every order for that school that is ready, and the packing list names the student on each line so the school can hand parcels to the right child.',
      'Once a van has gone it cannot be recalled. An order that turns out to be wrong comes back as a return, not by undoing the despatch.',
      'Shipped and Delivered are different. Shipped means it left the warehouse; Delivered means the school confirmed it arrived. Anything sitting between those for more than a fortnight appears on the leads’ dashboard as a parcel worth chasing.',
    ],
  },
  {
    path: '/receiving',
    title: 'Receiving from a Tailoring Center',
    points: [
      'Tailoring Centers do not use this system. The packing list arrives on paper with the goods and a warehouse clerk keys it in, which is why the packing list number is free text.',
      'What arrived and what the paper claims are recorded separately and never averaged. The difference is the thing you are here to resolve.',
      'Entering a receipt does not change stock. Posting it does, as a deliberate second step, so a delivery can be counted and checked before anything is committed.',
      'Posting cannot be undone. The stock ledger only ever adds entries, so a miscount is corrected with an inventory adjustment, not by editing the receipt.',
    ],
  },
  {
    path: '/production-orders',
    title: 'Production orders',
    points: [
      'A production order asks a Tailoring Center to make garments for a warehouse. Any centre can supply any warehouse — the primary centre is a default, not a restriction.',
      'Line prices come from the price list in force on the order date. Type a price only where one was negotiated; a garment with no price on that date is refused rather than costed at zero.',
      'The status shows what has actually arrived: awaiting delivery, partially received, received. It cannot show what a centre is doing, because nobody at a centre types anything into this system.',
      'Only the leads raise a production order. The warehouse reads the queue and receives against it.',
    ],
  },
  /*
    Two topics, and the longer path wins — so /adjustments/transfers gets the
    transfer notes and /adjustments/new inherits the adjustment ones.
  */
  {
    path: '/kits',
    title: 'Uniform Kits',
    points: [
      'A kit is a bundle a school orders as one line instead of five \u2014 a starter kit, say. It is a convenience for ordering and nothing more.',
      'No warehouse ever holds a kit. The moment one is ordered it becomes its component items, and picking, packing, shipping and the ledger all work from those. That is why a kit has no stock level.',
      'The price is the sum of its components at today\u2019s prices. A kit has no price of its own and no bundle discount, so repricing a garment changes every kit containing it the same day.',
      '\u201cCannot be priced\u201d means a component has no price on today\u2019s list, or the kit is empty. It is not zero, and a school cannot order it until the gap is filled.',
      'A kit belongs to one school level. A Primary kit cannot contain a High-School-only garment, so the picker only offers what fits.',
      'Kits are deactivated, never deleted. An inactive kit cannot be added to a new order; orders already placed are unaffected and reports still name it.',
      'Only the leads build kits. Schools and Finance read them.',
    ],
  },
  {
    path: '/adjustments/transfers',
    title: 'Warehouse Transfers',
    points: [
      'A transfer moves stock between two AsOne warehouses. Nothing is bought or sold, so the total value of inventory is the same before and after — only its location changes.',
      'Not the same as a backorder transfer. There, one warehouse takes over another warehouse\u2019s order and ships direct to the school; no goods pass between warehouses at all.',
      'Avail at Source is what that warehouse currently shows. A line asking for more than it holds is refused, and it is checked again when the transfer posts, because stock moves in between.',
      'Posting writes two ledger rows for every line \u2014 one out, one in, at the same unit value. It happens in one transaction, because a half-posted transfer would make the goods vanish.',
      'Prepared means the transfer is written down but nothing has moved yet. Only posting moves stock.',
      'Both leads can raise a transfer, not only Finance \u2014 F25 is wider than the adjustment screens beside it.',
    ],
  },
  {
    path: '/adjustments',
    title: 'Inventory Adjustments',
    points: [
      'This is the only place a stock figure changes with no physical event behind it. Everywhere else the number moves because a delivery arrived, an order was picked, or a van left.',
      'Finance only. AsOne\u2019s access matrix reserves adjustments for the Finance Department \u2014 neither lead can post one, and nor can the warehouse that does the counting. That is their open question, not an oversight here.',
      'Nothing is edited and nothing is deleted. A wrong adjustment is corrected by posting the opposite entry, so both stay in the audit trail forever.',
      'The reason code decides the direction, not the person posting. You type a count; whether it adds or removes comes from the code.',
      'Inventory Correction works differently from the rest. You enter what was actually counted and the system works out the difference itself \u2014 that is the whole point of it, so nobody counting has to do the subtraction.',
      'Reason codes are master data the leads maintain. If the code you need is missing, it has to be added there, not here.',
      'Search and Type narrow the page you are looking at. Date Range and Warehouse are applied to the whole history.',
    ],
  },
  {
    path: '/backorders',
    title: 'Backorders',
    points: [
      'If a warehouse cannot fill every line of a paid order, nothing ships. The order is held whole until stock arrives or somebody hands it to a warehouse that has it. There is no part-shipping \u2014 a school never gets a parcel with half the uniform in it.',
      'That is why one missing shirt holds the trousers too, and why this queue lists orders rather than garments.',
      'Oldest first. That is the rule, not a default: it is the sequence the schools placed them in. Working down from the top is what the pack asks the warehouse to do.',
      'Nothing here is created or resolved. An order appears when it is paid for and short, and leaves on its own the moment stock arrives \u2014 there is no status to set and nothing to tidy up.',
      'Waiting on shows every line that is short, and by how much. That is the decision: wait for the next delivery, or move the order.',
      'Transfer hands the order to a warehouse that holds enough of every line. Only those warehouses are listed, because a site that could fill some of it would only leave the order waiting in a second place.',
      'A transfer moves responsibility, not goods. No stock is reserved anywhere; the receiving warehouse picks in the ordinary way and ships direct to the school. The school keeps its own warehouse for everything it orders next.',
      'Refusals say why in plain words, with the numbers \u2014 which line, how many are needed, how many are there. Read them rather than retrying.',
    ],
  },
  {
    path: '/reports',
    title: 'Reports',
    points: [
      'Figures are shown as at the date you choose, not as at today. Change the date and every number on the page moves with it.',
      'Stock is valued at what was paid for it, not at today’s price list — so a report for last term still says what that term cost.',
      'Costed reports are for the leads and Finance. A warehouse sees the operational reports without the money.',
    ],
  },
  {
    path: '/schools',
    title: 'Schools',
    points: [
      'A school orders from one warehouse and no other. A backorder may still be filled by a different warehouse shipping direct, but that is a fulfilment decision made afterwards.',
      'A school orders from its own level. A primary school cannot order a high-school garment, the same rule its price list follows.',
      'Nothing here is deleted. A school that closes is deactivated, because every order it ever placed still points at it.',
    ],
  },
  {
    path: '/warehouses',
    title: 'Warehouses',
    points: [
      'Stock lives at a warehouse and moves by recorded transactions only — receipts, picks, shipments, transfers and adjustments. Nobody types a stock level.',
      'A warehouse clerk sees their own site. The leads and Finance see every site and can switch between them.',
      'Sites are deactivated, never deleted: every transaction that happened here still points at this record.',
    ],
  },
  {
    path: '/tailoring-centers',
    title: 'Tailoring Centers',
    points: [
      'Centres make the garments and are not users of this system. They exist here so production orders and receipts have something to point at.',
      'A centre supplies any warehouse. Its card shows what it has been asked for and how much has arrived.',
    ],
  },
] as const

/**
 * The topic for a path, by longest matching prefix.
 *
 * Longest wins so a detail route falls back to its list’s topic rather than
 * to nothing — `/orders/24` is still about orders.
 */
export function helpFor(pathname: string): HelpTopic | null {
  const matches = HELP_TOPICS.filter((topic) => pathname.startsWith(topic.path))
  if (matches.length === 0) return null

  return matches.reduce((best, topic) =>
    topic.path.length > best.path.length ? topic : best,
  )
}

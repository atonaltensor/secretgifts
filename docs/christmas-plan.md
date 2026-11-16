# Hollys' Christmas — customization plan

Plan for turning this fork of [Wishlist](https://github.com/cmintey/wishlist) into our family's
Christmas gift registry. Decisions are recorded here before any code is written.

## Background: what the app already does

- **Secret purchases already work.** Anyone can claim an item on someone else's list and tick
  "purchased" on the `/claims` page. With the group setting `claims.showForOwner` off (the default),
  list owners don't see claims on their own lists.
- **Claims are hidden on screen only.** The data still reaches the owner's browser, and
  `?filter=unclaimed` in the URL reveals what has been claimed. **Decision: accept this.**
  Nobody in the family is expected to go digging, so we won't fix it.
- **Lists can be managed for someone else.** `notForMe` ("this list is for someone else") and list
  managers already exist.

## Decisions

✅ = implemented.

### 0. Festive theme and branding ✅

- **Title:** replace "Wishlist" with **"Hollys' Christmas 2026"** in the top-left of the nav bar
  (`src/lib/components/navigation/NavBar.svelte:30`) and the mobile drawer
  (`NavigationDrawer.svelte:32`). Also update the browser tab title and the PWA app name/short name
  (`vite.config.ts`). Put the title in one constant so changing the year is a one-line edit.
- **Colors:** add a new Skeleton theme, `src/christmas.css`, alongside `src/wishlist.css`, and
  switch `data-theme` in `src/app.html`. Palette:
    - primary: deep Christmas red
    - secondary: evergreen green
    - tertiary: gold, for accents and "Most wanted"
    - surface: warm cream (light mode) and deep pine/charcoal (dark mode)

    Check both light and dark modes for contrast.

- **Logo/favicon:** swap the logo in the nav (`static/` and `assets/`) for a festive one, such as a
  wrapped present or an ornament.
- **Whimsy:** keep it light so the site stays usable on phones.
    - Gentle snowfall on the home page. Make it CSS-only, respect `prefers-reduced-motion`, and
      allow it to be turned off.
    - A "🎄 N days until Christmas" countdown on the home page.
    - Festive empty states, e.g. _"No wishes yet — the elves are standing by."_
    - Small festive confetti or a sparkle when someone taps "I'll get this".
    - Turning the snow off pops up a speech bubble for 3 seconds: _"Why would you stop the snow? ❄️"_

### 1. Friendlier wording ✅

Changes go in `src/i18n/en.json` only. Other languages keep their upstream text, which matters
little because the family uses English. Editing only the English file also keeps our diff small,
so upstream and Weblate updates still merge cleanly.

| Current                            | New                                 |
| ---------------------------------- | ----------------------------------- |
| Claim                              | **I'll get this**                   |
| Unclaim                            | **Never mind**                      |
| Claimed                            | **Someone's getting this**          |
| Claimed by {name}                  | **{name} is getting this**          |
| Claims (nav / `/claims` page)      | **My shopping list**                |
| Purchased / Mark item as purchased | **Bought ✓** / **I bought it**      |
| Most wanted                        | **Top of my list ⭐**               |
| Lists / My Lists                   | **Family / Our household** (see #2) |
| Create List                        | **Add a family member** (see #2)    |

The full list of strings to change will be confirmed by searching `en.json` for "claim",
"purchase" and "list" during implementation.

### 2. Households and family members

**Setup:** one login per household, 4 households in total. Each household manages one list per
person in it: the adults, the spouse and the kids.

**Decision: reuse the existing List model and rename it in the UI. No schema changes.**

- ✅ In the UI, a list is presented as a **family member**. List name = person's name ("Emma"); list
  icon/color = their avatar.
- ✅ The account's display name is the household ("The Hollys — Mike & Sarah"). List cards then
  read "Emma · The Hollys".
- ✅ **Create-list form:**
    - Retitle it "Add a family member" and relabel the name field "Who is this list for?"
    - Add helper text: "Make one for each person in your household — yourself, your partner, the kids."
- ✅ **Hidden settings:** remove `notForMe`, "hide owner" and "allow self claims" from the
  create/manage forms. They stay at their defaults (all **off**), so the forms stay simple.
- ✅ **No spoilers between households (decided):** with `notForMe` off and the group setting
  `claims.showForOwner` off, a household never sees what _other_ households have claimed for any
  of its members. Parents can't see claims on their kids' lists, and spouses can't see claims on
  each other's. Hiding `notForMe` from the form stops anyone switching it on by accident.
- **Home page:** group lists by household, so you see the Hollys' members together, then the
  next household's, and so on. Hide or label the "My Lists" section as "Our household".

- ✅ **Landing-page help text:** after login, users land on `/lists` (`src/routes/lists/+page.svelte`).
  Add a note at the top:

    > 🎄 **Add a list for each person in your household** — yourself, your partner, and each of the
    > kids. Other households will see these lists and secretly pick gifts from them.

    Show it as a large, friendly card while the household has no lists of its own. After that, show
    a smaller line the user can dismiss; the dismissal is remembered in browser storage.

**Known limitation of shared household logins:** surprises _within_ a household can't be tracked in
the app. Everyone in a household sees the same thing, so if Mom claims Dad's gift, Dad sees it
too, or nobody in the household sees it. **Accepted:** spoilers within a
household are fine, and gifts between household members are tracked offline. Surprises _between_
households work fully.

### 3. Deadline banner ✅

A banner at the top of every page: **"🎁 Lists lock December 1 — add your wishes!"**

- The date and text come from one constant (or a group setting), so next year is a one-line change.
- Show it until the deadline. After that, switch to something like "🎄 Lists are locked — happy
  shopping!", or hide it.
- **Banner only.** It reminds people but doesn't stop them editing lists after December 1.
  Enforcing the lock would be a separate, larger change.

### 4. Pre-filling households and family members (setup script)

**Decision: a one-time setup script (option A).** We won't use personalised invite links.

- New command `pnpm family:setup` (`prisma/family-setup.ts`), in the style of the existing
  `pnpm db:patch`. It reads `family.json` and creates:
    - the **"Hollys"** group
    - **4 household accounts**, each with a temporary password
    - the **11 family-member lists**, named and assigned to the right household
- **Safe to re-run:** the script skips anything that already exists and never overwrites changes
  people have made in the app.
- **Your household is the admin.** The household marked `"admin": true` in `family.json` gets the
  ADMIN role. The others are normal users.
- **Passwords:** the script prints each household's temporary password once. Households change it
  on the Account page, which already supports this.
- **Emails:** each account needs a unique email (real or placeholder). Password-reset emails only
  work if SMTP is configured. Otherwise the admin resets forgotten passwords from `/admin/users`.
- **Privacy:** `family.json` holds real names and emails, so it's added to `.gitignore`. A
  committed `family.example.json` shows the format.
- **Sign-up stays in place but unused.** The sign-up code isn't changed. The script turns off
  public sign-up, so nobody else can register.
- **No automatic first list:** the script turns off the group setting `enableDefaultListCreation`,
  so new accounts don't get an extra empty list alongside the script's lists.
- **No database changes, and no changes to existing app code.**

`family.example.json`:

```json
{
    "group": "Hollys",
    "households": [
        {
            "username": "hollys",
            "name": "The Hollys",
            "email": "hollys@example.com",
            "admin": true,
            "members": ["Mike", "Sarah", "Emma"]
        }
    ]
}
```

### 5. Only admins can create groups ✅

There's only one group, so creating groups is limited to admins.

- **Server:** in `src/routes/api/groups/+server.ts` (`PUT`), require the ADMIN role instead of
  just a login. This is the real protection.
- **UI:** hide "Create group" in the nav menu (`GroupSubMenu.svelte`) from non-admins. The
  admin page (`/admin/groups`) is already admin-only.

### 6. Settings (no code)

The setup script applies these settings. They're listed here for reference:

- `claims.showForOwner`: **off**. This is what keeps claims secret between households (see #2).
- `claims.showName`: **on**, so households can see who's getting what for _other_ households and
  avoid duplicate gifts.
- `enableSignup`: **off**. `enableDefaultListCreation`: **off** (see #4).
- Optional: "surprise" suggestion mode, so other households can add a gift to someone's list that
  the list owner never sees. Decide later.

### 7. Only admins can change the language ✅

The family uses English, so the "Language" option in the avatar menu (`NavMenu.svelte`) is hidden
from non-admins. UI only: the language is just a display preference, so the server isn't locked down.

### 8. Festive login page ✅

The login page (`src/routes/login/+page.svelte`) is the first thing everyone sees, so it gets some whimsy:

- Snowfall (same component and on/off preference as the home page).
- Festive wording: heading _"Who's knocking at the North Pole? 🎅"_, button _"Let me in! 🎄"_, username label
  _"Your household's username"_.
- A random greeting on each visit, e.g. _"The cocoa's ready. Come on in!"_
- Wrong password: _"Hmm, the elves don't recognize that one 🧝"_. While signing in: _"Checking the list… twice…"_
- A string of twinkling lights along the top of the login card (still when reduced motion is on).
- A snowman sitting on the card who covers his eyes while you type your password, and peeks with one eye when
  you press "show password".
- **Nothing on this page names a household or family member**, because it's visible to anyone with the URL.

### Not in scope (parked ideas)

Shopping list totals, a printable shopping list, a gift-wrapped look for bought items, and a Secret
Santa draw.

## Resolved questions

1. **Spoilers:** households must not see what other households have claimed for their members.
   Spoilers within a household are fine. → `notForMe` and `claims.showForOwner` off; `notForMe` is
   hidden from the forms.
2. **Year:** 2026.
3. **Extras:** only the deadline banner (#3).
4. **Pre-filling households:** a setup script (#4), not personalised invite links. Admin household,
   email, sign-up and privacy handling as described in #4.
5. **Groups:** only admins can create them (#5).

## Implementation notes

- Keep changes small and in few places (theme file, `en.json`, a few components) to ease
  merging upstream updates.
- Verify with `pnpm check`, `pnpm lint` and a manual run (`pnpm dev`) in light and dark modes, on
  desktop and phone widths. The Playwright e2e tests (`pnpm test`) select buttons by English text,
  e.g. "Claim" in `tests/modules/item-card.ts` and `claim-item-modal.ts`, so update them along with
  the wording.

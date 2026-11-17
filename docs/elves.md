# Where the elves are

Every place an elf shows up on the site, and how to make each one appear. Use this when checking a change, or
when showing the site to the family.

All the pictures are SVG files in `src/lib/assets/`. They're drawn in the same flat style, use the same elf
(pointy hat, striped stockings, curly boots), and look fine in light and dark mode. Each picture's alt text
(what a screen reader says) is in `src/i18n/en.json` under `a11y`. Other languages show the English alt text
until someone translates it.

## Pictures

| #   | Where                        | What you see                                                                      | Image file             |
| --- | ---------------------------- | --------------------------------------------------------------------------------- | ---------------------- |
| 1   | Empty list                   | Two elves standing by an open, empty gift box                                     | `no_wishes_elves.svg`  |
| 2   | Empty list, by the + button  | An elf peeks up from behind the red + button, with a speech bubble                | `elf_peek.svg`         |
| 3   | After adding an item         | A small elf giving a thumbs-up in the "Item created — the elves approve!" message | `elf_thumbs_up.svg`    |
| 4   | Empty shopping list          | An elf shrugging beside an empty sleigh                                           | `no_claims_sleigh.svg` |
| 5   | Page not found (404)         | A confused elf holding an upside-down map, next to a signpost pointing three ways | `not_found_elf.svg`    |
| 6   | Not authorized (401)         | A stern elf with arms crossed, guarding a locked workshop door                    | `unauthorized_elf.svg` |
| 7   | Something went wrong (other) | A worried elf holding a wrench, next to a toy robot that has fallen apart         | `error_elf.svg`        |

### 1. Empty list: elves standing by

- **Shows when:** you open a list that has no items. Anyone who can see the list sees it.
- **Caption:** _"No wishes yet — the elves are standing by."_
- **To see it:** create a new list (Home → your household → add a list), then open it. Or delete every item on
  an existing list.
- **Code:** `src/routes/lists/[id]/+page.svelte`, the `{#if items.length === 0}` block.

### 2. Peeking elf by the red + button

- **Shows when:** the list is empty **and** you can add to it. That means you own the list, you manage it, or
  the group lets people suggest items on other people's lists. It goes away as soon as the list has an item.
- **What it does:** the elf slides up from behind the + button, then a bubble says _"Add your first wish here!"_
  If your phone or computer is set to reduce motion, the elf and bubble just appear without moving.
- **To see it:** open the same empty list as in #1, signed in as the household that owns it.
- **Code:** `src/routes/lists/[id]/+page.svelte`, next to the "Add Item button". The animation is in the
  `<style>` block at the bottom of that file. The caption is `wishes.add-first-wish`.

### 3. Thumbs-up elf after adding an item

- **Shows when:** you save a new item. This works with either "Add item" or "add and stay on this page", and
  also when you suggest an item for someone else's list.
- **Message:** _"Item created — the elves approve!"_ It sits at the bottom of the screen for a few seconds.
- **To see it:** press the red + button on any list, type a name, and save.
- **Code:** `src/routes/lists/[id]/create-item/+page.svelte` passes the picture to the message. Messages can
  carry a picture through `meta: { image }`, and `src/lib/components/toaster/Toaster.svelte` draws it. To add an
  elf to another message, pass `meta: { image: ... }` the same way.

### 4. Empty shopping list: shrugging elf

- **Shows when:** **My Shopping List** (`/claims`) is empty, meaning you haven't said "I'll get this" for
  anything yet.
- **Caption:** _"Your sleigh is empty! Find a gift on someone's list and tap “I'll get this”."_
- **To see it:** sign in as a household that hasn't claimed anything and open **My Shopping List**. Or un-claim
  everything on your shopping list.
- **Code:** `src/routes/claims/+page.svelte`.

### 5. Page not found (404)

- **Shows when:** the address doesn't match any page, or a list no longer exists.
- **Caption:** _"Not Found"_, plus a note to contact the site admin.
- **To see it:** go to any made-up address, such as `/north-pole`.
- **Code:** `src/routes/+error.svelte`. This one file handles all three error pictures (#5–#7).

### 6. Not authorized (401)

- **Shows when:** the site refuses a page with status 401. For example:
    - opening `/signup` when new sign-ups are turned off (the site is invite-only), or
    - opening the add-item page for **someone else's** list when the group doesn't allow suggestions.
- **To see it:** the quickest way is to sign out and go to `/signup`. This works while sign-ups are turned off
  in the admin settings.
- **Code:** `src/routes/+error.svelte`.

### 7. Something went wrong (any other error)

- **Shows when:** an error has any status other than 401 or 404. That includes real server errors (500), and
  also 400 and 403.
- **To see it:** sign in as a household that **isn't** the admin and go to `/admin`. You get a 403, so this
  picture appears with the words _"Not Authorized"_.
- **Code:** `src/routes/+error.svelte`. The picture is chosen by status: 401 and 404 have their own, and
  everything else uses this one.

## Elves in the wording

These have no picture, just text.

| Where             | Text                                           | Shows when                                             | i18n key                |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------ | ----------------------- |
| Login page        | _"Santa's elves are expecting you."_           | One of 4 random greetings, so reload until it comes up | `auth.login-greeting-2` |
| Login page        | _"Hmm, the elves don't recognize that one 🧝"_ | Sign in with a wrong username or password              | `auth.login-invalid`    |
| Empty list        | _"No wishes yet — the elves are standing by."_ | Same as picture #1                                     | `wishes.no-wishes-yet`  |
| After adding item | _"Item created — the elves approve!"_          | Same as picture #3                                     | `wishes.item-created`   |

## Quick check of every elf

Signed in as a household that owns a list:

1. Make a new, empty list and open it. You should see #1 and #2.
2. Add an item to it. You should see #3, and #2 should go away.
3. Open **My Shopping List** before claiming anything. You should see #4.
4. Go to `/north-pole`. You should see #5.
5. Go to `/admin` (as a household that isn't the admin). You should see #7.
6. Sign out and go to `/signup` (while sign-ups are turned off). You should see #6.
7. On the login page, enter a wrong password to see the elf wording.

Delete the test list afterwards.

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

### 4. Pre-filling households and family members (setup script) ✅

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

**Running it.** Copy `family.example.json` to `family.json` and fill it in. Then:

- Locally: `pnpm family:setup` (or `pnpm family:setup path/to/family.json`).
- In production it runs automatically every time the container starts, as long as `family.json` is
  next to `docker-compose.yaml` on the NAS (see "Deploying to the NAS"). To run it by hand in a
  running container instead:

    ```sh
    docker cp family.json wishlist-prod:/tmp/family.json
    docker exec -e DATABASE_URL=file:/usr/src/app/data/prod.db wishlist-prod pnpm family:setup /tmp/family.json
    docker exec wishlist-prod rm /tmp/family.json
    ```

**As built:** a fresh database's empty "Default" group is renamed to the family group instead of
leaving it unused. Settings (#6) are only written if they aren't set yet, so re-running never undoes a
change made in the app; the script says when it leaves a different value alone. To add someone later,
add them to `family.json` and re-run. `family.json` is in both `.gitignore` and `.dockerignore`.

**Setup script vs. dev seed.** There are two ways to fill a database with households. Only the setup
script is meant for the real site; the dev seed is for clicking around locally with sample data.

|                    | `prisma/seed-dev.ts` (dev / testing)                           | `pnpm family:setup` (real use)                                                     |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Input              | `prisma/seed-dev.json` (falls back to `seed-dev.example.json`) | `family.json` (see `family.example.json`)                                          |
| Passwords          | Everyone uses `password`                                       | A random temporary password per household, printed once                            |
| Lists              | Pre-filled with sample gifts and claims                        | One empty list per family member                                                   |
| Other              | —                                                              | Creates the family group, sets up email addresses and applies the settings from #6 |
| In the prod image? | No, `.dockerignore` keeps it out                               | Yes, it's built to run inside the prod container                                   |

Both data files are git-ignored because they hold real names. When the family changes (someone added
or removed), update both files so local testing matches the real site.

### 5. Only admins can create groups ✅

There's only one group, so creating groups is limited to admins.

- **Server:** in `src/routes/api/groups/+server.ts` (`PUT`), require the ADMIN role instead of
  just a login. This is the real protection.
- **UI:** hide "Create group" in the nav menu (`GroupSubMenu.svelte`) from non-admins. The
  admin page (`/admin/groups`) is already admin-only.

### 6. Settings (no code) ✅

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

### 9. Elves ✅

Elf pictures on empty pages and error pages, an elf that peeks out from behind the + button on an empty list,
and a thumbs-up elf when you add an item. Every spot, and how to make each one appear, is listed in
[elves.md](elves.md).

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

## Deploying to the NAS

The live site is **https://www.doucettes.org**, running on the Synology NAS (Intel Celeron J3455) as
a Container Manager project. Nothing is built on the NAS and no SSH is needed. How it fits together:

- **GitHub builds the image.** On every push to `main`, `.github/workflows/build_push.yml` builds
  the image and publishes it as `ghcr.io/atonaltensor/secretgifts:main`. It holds no family data:
  `.dockerignore` keeps out `family.json`, the seed data and the avatars. It does include the site
  title with the family surname, which is already in the public repo.
- **The NAS runs it.** A Container Manager project uses `docker-compose.yaml`, which downloads that
  image, runs it as `wishlist-prod` on the NAS's port 9000 (the app's port 3280 inside the container) and sets `ORIGIN` to the live address.
- **Households are created on start.** If `family.json` is next to the compose file, the container
  runs `family:setup` (#4) every time it starts. That's safe because existing households and lists
  are skipped. If the file has a mistake, the error goes to the log and the site starts anyway.
- **The NAS's reverse proxy handles HTTPS.**

### 1. Set up GitHub (once)

1. **Turn on Actions.** On github.com, open the repo's **Actions** tab. If GitHub says workflows are
   disabled (it does this for repos created as a fork), click the button to enable them.
2. **Run the first build.** Push to `main`, or in Actions open **Build and Push Docker Image** →
   **Run workflow** on `main`. Wait for the green check.
3. **Make the image public.** New images start private, and a private one would make the NAS log in
   to GitHub. Go to your GitHub profile → **Packages** → **secretgifts** → **Package settings** →
   **Change visibility** → **Public**.
4. **Check:** the package page lists a `main` tag, plus a `sha-…` tag for each build.

No secrets or tokens need setting up: the workflow uses GitHub's built-in token. Only `main` is
published, so pushing other branches doesn't change the live site.

### 2. Stage the files on the NAS (once)

Install **Container Manager** from Package Center if it isn't already; it creates a `docker` shared
folder. In **File Station**, create this folder and upload the files into it:

```
docker/secretgifts/
├── docker-compose.yaml        from the repo
├── family.json                from your computer (git-ignored)
├── images/
│   └── christmas_avatars/     emma.svg, mike.svg, … from your computer (git-ignored)
├── data/                      create it empty: the database goes here
└── uploads/                   create it empty: uploaded gift pictures go here
```

- **`family.json` must be there before the project's first start.** If it's missing, Docker creates
  an empty _folder_ called `family.json` instead, and setup is skipped. To fix that, delete the
  folder, upload the file and restart the project.
- **Avatars:** upload the `.svg` files (or `.png` if there's no SVG), named after each person's list.
  You can leave out `contact_sheet.png` and `.DS_Store`.

### 3. Set up the address and HTTPS (once)

1. **DNS and router:** point both `doucettes.org` and `www.doucettes.org` at your home's public IP
   (or a Synology DDNS name), and forward ports 80 and 443 on the router to the NAS.
2. **Certificate:** Control Panel → Security → Certificate → Add → Let's Encrypt. Domain name:
   `www.doucettes.org`; Subject Alternative Name: `doucettes.org`. One certificate must cover both
   names, or visitors to the bare domain get a security warning before they can be redirected.
3. **Reverse proxy:** Control Panel → Login Portal → Advanced → Reverse Proxy → Create, once for each
   name. Source: HTTPS, `www.doucettes.org` (then `doucettes.org`), port 443. Destination: HTTP,
   `localhost`, port 9000. Then assign the certificate to both hostnames under Certificate → Settings.
4. **Firewall:** if the NAS firewall is on with a final "deny all" rule, it must also allow Docker's
   own networks, or the app can't look up shop websites and auto-fill from a link fails. Control
   Panel → Security → Firewall → Edit Rules → Create. Ports: All. Source IP: Subnet `172.16.0.0`,
   mask `255.240.0.0`. Action: Allow. Drag it **above** the final deny rule.
    - That range (172.16.0.0–172.31.255.255) is where Docker creates every project's private
      network, and each project gets a new one. A rule for a single network (e.g. `172.24.0.0/16`)
      only covers projects that already exist, so the next new project fails again.
    - It opens nothing to the outside: only Docker's internal networks use these addresses, as long
      as the home network itself uses `192.168.x.x` or `10.x.x.x`.
    - The website itself needs only ports 80 and 443 (TCP) allowed from outside.

**One main address.** Logins and forms only work at the exact `ORIGIN` address,
`https://www.doucettes.org`. The bare domain is redirected there by the app itself: the compose
file sets `REDIRECT_HOSTS: doucettes.org`, and the container's Caddy server (`Caddyfile`) answers
those requests with a permanent redirect to the same page on `www`. Synology's reverse proxy can't
redirect on its own, so it simply sends both names to port 9000.

- **Check it after deploying:** open `https://doucettes.org/lists`. The address bar should change to
  `https://www.doucettes.org/...`. If it doesn't, the reverse proxy isn't passing the original
  address through to the app. The site still works at `www`; only the redirect is missing.

### 4. Create the project (once)

1. **Container Manager → Project → Create.**
2. **Project name:** `secretgifts`. **Path:** `docker/secretgifts`. When Container Manager finds the
   `docker-compose.yaml` there, choose to use it.
3. **Web portal:** leave it off. The reverse proxy from step 3 already handles the address.
4. **Finish.** Container Manager downloads the image and starts the container. The first time takes a
   few minutes.
5. **Copy the passwords.** Open **Container → `wishlist-prod` → Log** and find _"Temporary
   passwords"_. Save them in a password manager and send each household theirs. They're printed only
   on the first start, and disappear from the log when the container is recreated (e.g. by an
   update). Households can change their password on the Account page.
6. **Check:** open https://www.doucettes.org, log in as `admin`, and check that every family member's
   list is there with their avatar.

### Day to day

- **Updating the site:** push to `main` and wait for the Actions build to go green. Then in Container
  Manager → Project → `secretgifts`: **Stop**, then **Action → Build**. That downloads the new image
  (`pull_policy: always`) and recreates the container. The database and uploads are in `data/` and
  `uploads/`, so they're kept.
- **Adding a person or household:** download `family.json` in File Station, edit it, upload it again,
  then stop and start the project. New households' passwords appear in the log. Setup never deletes
  anything: to remove someone, delete their list or account in the app as admin.
- **Adding or changing an avatar:** upload it to `images/christmas_avatars/`. No restart is needed,
  though browsers may show the old picture for up to an hour.
- **Rolling back:** in `docker-compose.yaml`, change `:main` to an earlier `:sha-…` tag from the
  package page, upload it, then **Stop** and **Build**. Change it back to `:main` afterwards.
- **Backups:** include `docker/secretgifts/data` and `docker/secretgifts/uploads` in Hyper Backup.
  Back up `family.json` and the avatars somewhere too, since they aren't in git.
- **Testing a production build locally:** the compose file only downloads the published image. To
  try changes before pushing, build and run the image yourself (see `.devcontainer/README.md`).

### Troubleshooting

- **Auto-fill from a link fails; the log shows `getaddrinfo EAI_AGAIN <shop website>`.** The
  container can't look up web addresses. On the NAS this was the firewall blocking the project's
  Docker network (see step 3.4). Check from Container → `wishlist-prod` → Terminal:
  `getent hosts www.amazon.com` should print an address. Changing DNS servers (`dns:` in the compose
  file) doesn't help when the firewall is the cause.
- **The first start takes several minutes.** On an empty database the app applies all of its
  database migrations (the whole history of its database layout) one at a time, and each one waits
  for slow disk writes on the NAS. Later starts skip them and take seconds. The passwords are printed
  after the migrations, just before `Listening on http://0.0.0.0:3000`.
- **No passwords in the log.** Wait for `Listening on …` first. If there's still no
  `$ tsx prisma/family-setup.ts family.json` line, `family.json` wasn't there at first start: check
  in File Station that it's a file, not an empty folder Docker created in its place (see step 2).
- **A container named `<numbers>_wishlist-prod` that Container Manager can't stop ("Container
  undefined does not exist").** A recreate (Stop → Build) didn't finish its last step: the new
  container runs under a temporary name and the site still works. Over SSH (`sudo -i`), check with
  `docker ps -a | grep wishlist-prod`, then give it its real name:
  `docker rename <numbers>_wishlist-prod wishlist-prod`. Don't delete it: it's the one serving the
  site.
- **Log noise you can ignore:** requests for `/wp-admin/…` or `/xmlrpc.php` are bots probing for
  WordPress, and `/service-worker.js` 404s come from browsers that visited an older app on the same
  address. Neither affects the site.
- **Exported logs contain the temporary passwords.** Delete any downloaded copy of the container log
  once the passwords are saved somewhere safe.

## Implementation notes

- Keep changes small and in few places (theme file, `en.json`, a few components) to ease
  merging upstream updates.
- Verify with `pnpm check`, `pnpm lint` and a manual run (`pnpm dev`) in light and dark modes, on
  desktop and phone widths. The Playwright e2e tests (`pnpm test`) select buttons by English text,
  e.g. "Claim" in `tests/modules/item-card.ts` and `claim-item-modal.ts`, so update them along with
  the wording.

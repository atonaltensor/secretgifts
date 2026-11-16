<div align="center">
<img src="./src/lib/assets/logo.svg" width="140" alt="" />
<h1>Secret Gifts</h1>
<p>The Doucettes' family Christmas gift registry 🎄</p>
<p><a href="https://www.doucettes.org">www.doucettes.org</a></p>
</div>

## What this is

Every year our extended family tries to coordinate Christmas gifts across several households. Who
wants what? Has someone already bought it? Secret Gifts is a small private website that answers both,
without spoiling any surprises.

It's a customized fork of [Wishlist](https://github.com/cmintey/wishlist) by Carter Mintey, a
self-hosted wishlist app. Wishlist does the hard parts: lists, claims, product details fetched from a
link, and mobile support. This fork makes it feel like our family's Christmas.

## How it works for the family

- **Each household gets one login.** Inside it, there's a list for every person in that household.
  The lists are set up ahead of time, so nobody has to create anything.
- **Add gifts you'd like to your own lists.** Paste a link and the app fills in the name, price and
  picture.
- **Claim gifts you plan to buy from other people's lists.** It's a secret: the person whose list
  it is never sees what's been claimed. Other households can, so two people don't buy the same
  thing.
- **"My Shopping List"** collects everything you've claimed, so you can tick items off as you buy them.

## What's different from Wishlist

- **Festive look:** red and green theme, Christmas logo and icons, falling snow (with an off switch),
  a countdown to Christmas, and a little sparkle when you claim a gift.
- **Households and family members:** lists are shown as people, with each person's avatar on a
  portrait-style card, laid out in a grid so everyone fits on one screen.
- **A deadline banner** reminding everyone when lists lock (December 1).
- **Friendlier wording** throughout, a welcome note explaining how it works, and a playful login page.
- **No spoilers:** claims stay hidden from the list owner, and options that could reveal them are
  turned off.
- **Admin only:** only the admin can create groups or change the language.
- **One-step family setup:** `pnpm family:setup` creates every household, list and setting from a
  single `family.json` file.
- **Hands-off deploys:** GitHub builds the image, and the Synology NAS runs it.

The full story, including each decision and why, is in
[docs/christmas-plan.md](docs/christmas-plan.md).

## Keeping family details private

This repo is public, so **real family data never goes in git or the Docker image**:

| File                        | What it holds                                               | Example to copy                |
| --------------------------- | ----------------------------------------------------------- | ------------------------------ |
| `family.json`               | Households, emails and family members for the live site     | `family.example.json`          |
| `prisma/seed-dev.json`      | The same households, with sample gifts, for local testing   | `prisma/seed-dev.example.json` |
| `images/christmas_avatars/` | One picture per person, named after their list (`emma.svg`) | —                              |

All three are listed in `.gitignore` and `.dockerignore`. When writing code comments or docs, use
the made-up names from the example files (Emma, Mike, Sarah), never real ones.

## Running the live site

The site runs on our Synology NAS as a Container Manager project:

1. Every push to `main` builds a new image and publishes it to
   `ghcr.io/atonaltensor/secretgifts:main`
   ([workflow](.github/workflows/build_push.yml)).
2. On the NAS, the project folder holds `docker-compose.yaml`, `family.json` and the avatars.
   Container Manager downloads the image and runs it.
3. On start, the container creates any households and lists from `family.json` that don't exist yet.
4. The NAS's reverse proxy serves it over HTTPS at www.doucettes.org.

Step-by-step setup, updating, rolling back and backups are covered in
[Deploying to the NAS](docs/christmas-plan.md#deploying-to-the-nas).

## Working on it

The easiest way to start is the VS Code dev container: open the repo and choose **Reopen in
Container**. [.devcontainer/README.md](.devcontainer/README.md) covers setup, checks, the end-to-end
tests and building a production image locally.

```sh
pnpm dev                              # app at http://localhost:5173
pnpm exec tsx prisma/seed-dev.ts      # sample households to log in as (password: "password")
pnpm check && pnpm lint               # types, formatting and lint
pnpm test                             # Playwright end-to-end tests
```

[DEVELOPMENT.md](DEVELOPMENT.md) has the general (non-container) setup from upstream.

## Getting ready for next Christmas

Most of what changes each year lives in one file, [`src/lib/christmas.ts`](src/lib/christmas.ts):

- `SITE_TITLE` and `SITE_SHORT_TITLE`: update the year.
- `LISTS_LOCK_DATE`: the date the deadline banner counts down to.

Then update `family.json` for anyone new, push to `main`, and update the project on the NAS. Last
year's lists and claims stay in the database. Clear them out in the app, or start the project with
an empty `data/` folder for a fresh start.

## Credits and license

Built on [Wishlist](https://github.com/cmintey/wishlist) by Carter Mintey and its contributors, under
the MIT License (see [LICENSE](LICENSE)). Everything the original supports still works here, such as
email invites over SMTP, OpenID Connect sign-in and the bookmarklet. See the
[upstream README](https://github.com/cmintey/wishlist#readme) for those. Changes are kept small and in
few places, so updates from upstream can still be merged in.

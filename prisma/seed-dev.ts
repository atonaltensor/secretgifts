// Dev-only seed: dummy household accounts with family-member lists, items and claims.
// Run with: pnpm exec tsx prisma/seed-dev.ts            (skips users that already exist)
//           pnpm exec tsx prisma/seed-dev.ts --reset    (deletes ALL users, lists, items and claims first)
// Data: prisma/seed-dev.json if present (git-ignored), else prisma/seed-dev.example.json;
//       or pass a path to another .json file.
// All accounts use the password "password".
import { existsSync, readFileSync } from "node:fs";
import { prisma } from "./client";
import { hashPassword } from "../src/lib/server/password";

const PASSWORD = "password";
const RESET = process.argv.includes("--reset");

type Member = { name: string; items: [string, string?][] };
type Household = { username: string; name: string; admin?: boolean; members: Member[] };
// Who claims what: [claimer username, list owner username, member name, item index]
type Claim = [string, string, string, number];
type SeedData = { households: Household[]; claims: Claim[] };

// Real family data lives in the git-ignored prisma/seed-dev.json (same shape as the example file).
const dataPath = [process.argv.find((a) => a.endsWith(".json")), "prisma/seed-dev.json", "prisma/seed-dev.example.json"]
    .filter((p): p is string => !!p)
    .find((p) => existsSync(p))!;
console.log(`seeding from ${dataPath}`);
const { households, claims }: SeedData = JSON.parse(readFileSync(dataPath, "utf8"));

const reset = async () => {
    // Children first: list items and lists reference users without cascading.
    await prisma.itemClaim.deleteMany();
    await prisma.listItem.deleteMany();
    await prisma.listManager.deleteMany();
    await prisma.item.deleteMany();
    await prisma.list.deleteMany();
    await prisma.session.deleteMany();
    await prisma.userGroupMembership.deleteMany();
    const { count } = await prisma.user.deleteMany();
    console.log(`reset: deleted ${count} users and all lists, items and claims`);
};

const main = async () => {
    const group = await prisma.group.findFirst({ orderBy: { name: "asc" } });
    if (!group) throw new Error("No group found - run `pnpm prisma db seed` first");

    if (RESET) await reset();

    const hashedPassword = await hashPassword(PASSWORD);
    const userIds: Record<string, string> = {};
    const listIds: Record<string, string> = {};
    const itemIds: Record<string, number[]> = {};

    for (const h of households) {
        const existing = await prisma.user.findUnique({ where: { username: h.username } });
        if (existing) {
            console.log(`skip ${h.username} (exists)`);
            userIds[h.username.toLowerCase()] = existing.id;
            continue;
        }
        const user = await prisma.user.create({
            data: {
                username: h.username,
                name: h.name,
                email: `${h.username.toLowerCase()}@example.com`,
                roleId: h.admin ? 2 : 1,
                hashedPassword,
                UserGroupMembership: { create: { groupId: group.id, active: true, roleId: h.admin ? 3 : 1 } }
            }
        });
        userIds[h.username.toLowerCase()] = user.id;

        for (const m of h.members) {
            const list = await prisma.list.create({
                data: { name: m.name, ownerId: user.id, groupId: group.id }
            });
            const key = `${h.username.toLowerCase()}/${m.name}`;
            listIds[key] = list.id;
            itemIds[key] = [];
            for (const [i, [name, price]] of m.items.entries()) {
                const item = await prisma.item.create({
                    data: {
                        name,
                        price,
                        userId: user.id,
                        createdById: user.id,
                        lists: { create: { listId: list.id, addedById: user.id, displayOrder: i } }
                    }
                });
                itemIds[key].push(item.id);
            }
        }
        console.log(`created ${h.username} with ${h.members.length} lists`);
    }

    for (const [claimer, owner, member, idx] of claims) {
        const key = `${owner.toLowerCase()}/${member}`;
        if (!listIds[key] || !userIds[claimer.toLowerCase()]) continue; // owner already existed; don't double-claim
        await prisma.itemClaim.create({
            data: { itemId: itemIds[key][idx], listId: listIds[key], claimedById: userIds[claimer.toLowerCase()] }
        });
    }

    console.log(`\nLog in at http://localhost:5173 with any of: ${households.map((h) => h.username).join(", ")}`);
    console.log(
        `Password for all: ${PASSWORD}  (admin role: ${households.filter((h) => h.admin).map((h) => h.username)})`
    );
};

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

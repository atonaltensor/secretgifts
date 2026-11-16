// One-time family setup (docs/christmas-plan.md #4).
//
//   pnpm family:setup [path/to/family.json]      (default: ./family.json)
//
// Creates the family group, one account per household (with a temporary password, printed once),
// and one list per family member. Applies the settings from plan #6. Safe to re-run: anything that
// already exists is skipped, and nothing changed in the app is overwritten.
//
// Self-contained on purpose: the production image has `prisma/` but not `src/`, so this file must not
// import from `src/` (except the generated Prisma client, via ./client).
import { readFileSync } from "node:fs";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { init } from "@paralleldrive/cuid2";
import { prisma } from "./client";

type Household = { username: string; name: string; email: string; admin?: boolean; members: string[] };
type FamilyFile = { group: string; households: Household[] };

const ROLE_USER = 1;
const ROLE_ADMIN = 2;
const GLOBAL = "global";

// --- Passwords: same "s2" scrypt format as src/lib/server/password.ts -------------------------

const hashPassword = async (password: string) => {
    const salt = encodeHexLowerCase(crypto.getRandomValues(new Uint8Array(16)));
    const key = await scryptAsync(
        new TextEncoder().encode(password.normalize("NFKC")),
        new TextEncoder().encode(salt),
        { N: 16384, r: 16, p: 1, dkLen: 64 }
    );
    return `s2:${salt}:${encodeHexLowerCase(new Uint8Array(key))}`;
};

const WORDS = [
    "tinsel",
    "sleigh",
    "cocoa",
    "holly",
    "frost",
    "garland",
    "snowman",
    "reindeer",
    "mitten",
    "candle",
    "cookie",
    "wreath",
    "ribbon",
    "jingle",
    "pinecone",
    "sparkle"
];
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes (0/o, 1/l/i)

/** e.g. "tinsel-k7pm-x2qd": easy to read out, ~46 bits of randomness. */
const tempPassword = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(9));
    const chunk = (from: number) =>
        Array.from(bytes.slice(from, from + 4), (b) => ALPHABET[b % ALPHABET.length]).join("");
    return `${WORDS[bytes[8] % WORDS.length]}-${chunk(0)}-${chunk(4)}`;
};

// --- Input -------------------------------------------------------------------------------------

const readFamily = (path: string): FamilyFile => {
    let data: FamilyFile;
    try {
        data = JSON.parse(readFileSync(path, "utf8"));
    } catch (e) {
        throw new Error(`Could not read ${path}: ${(e as Error).message}`, { cause: e });
    }

    const problems: string[] = [];
    if (!data.group?.trim()) problems.push(`"group" is missing`);
    if (!Array.isArray(data.households) || data.households.length === 0) problems.push(`"households" is empty`);
    const seen = { username: new Set<string>(), email: new Set<string>() };
    for (const [i, h] of (data.households ?? []).entries()) {
        const where = `households[${i}]`;
        for (const field of ["username", "name", "email"] as const) {
            if (typeof h[field] !== "string" || !h[field].trim()) problems.push(`${where}.${field} is missing`);
        }
        if (!Array.isArray(h.members)) problems.push(`${where}.members must be a list of names`);
        for (const field of ["username", "email"] as const) {
            const value = h[field]?.toLowerCase();
            if (value && seen[field].has(value)) problems.push(`${where}.${field} "${h[field]}" is used twice`);
            if (value) seen[field].add(value);
        }
    }
    if (!data.households?.some((h) => h.admin)) problems.push(`no household has "admin": true`);
    if (problems.length) throw new Error(`${path} has problems:\n  - ${problems.join("\n  - ")}`);
    return data;
};

// --- Setup steps -------------------------------------------------------------------------------

const ensureGroup = async (name: string) => {
    const existing = await prisma.group.findUnique({ where: { name } });
    if (existing) {
        console.log(`group "${name}": exists`);
        return existing;
    }
    // A fresh database has an empty "Default" group from the seed: reuse it rather than leave it lying around.
    const groups = await prisma.group.findMany({ include: { _count: { select: { UserGroupMembership: true } } } });
    if (groups.length === 1 && groups[0].name === "Default" && groups[0]._count.UserGroupMembership === 0) {
        console.log(`group "${name}": renamed from the empty "Default" group`);
        return prisma.group.update({ where: { id: groups[0].id }, data: { name } });
    }
    console.log(`group "${name}": created`);
    return prisma.group.create({ data: { name } });
};

/** Set a config value only if it isn't set yet, so changes made in the app are never undone. */
const ensureSetting = async (key: string, value: string, groupId = GLOBAL) => {
    const scope = groupId === GLOBAL ? "global" : "group";
    const existing = await prisma.systemConfig.findUnique({ where: { key_groupId: { key, groupId } } });
    if (!existing) {
        await prisma.systemConfig.create({ data: { key, value, groupId } });
        console.log(`setting ${key} (${scope}) = ${value}`);
    } else if (existing.value !== value) {
        console.log(
            `setting ${key} (${scope}) left as ${existing.value} (plan says ${value}; it was changed in the app)`
        );
    }
};

const ensureHousehold = async (h: Household, groupId: string) => {
    const created: { password?: string } = {};
    let user = await prisma.user.findUnique({ where: { username: h.username } });
    if (user) {
        console.log(`household ${h.username}: exists (password and role unchanged)`);
    } else {
        created.password = tempPassword();
        user = await prisma.user.create({
            data: {
                username: h.username,
                name: h.name,
                email: h.email,
                roleId: h.admin ? ROLE_ADMIN : ROLE_USER,
                hashedPassword: await hashPassword(created.password)
            }
        });
        console.log(`household ${h.username}: created${h.admin ? " (admin)" : ""}`);
    }

    const membership = await prisma.userGroupMembership.findFirst({ where: { userId: user.id, groupId } });
    if (!membership) {
        // Only make this group active if the household isn't active in another one.
        const active = !(await prisma.userGroupMembership.findFirst({ where: { userId: user.id, active: true } }));
        await prisma.userGroupMembership.create({ data: { userId: user.id, groupId, active } });
    }

    const listId = init({ length: 10 });
    for (const member of h.members) {
        const exists = await prisma.list.findFirst({ where: { ownerId: user.id, groupId, name: member } });
        if (exists) continue;
        await prisma.list.create({ data: { id: listId(), name: member, ownerId: user.id, groupId } });
        console.log(`  list "${member}": created`);
    }
    return created.password;
};

// --- Main --------------------------------------------------------------------------------------

const main = async () => {
    const path = process.argv[2] ?? "family.json";
    const family = readFamily(path);

    const group = await ensureGroup(family.group.trim());

    // Plan #6. Global, plus the group so a group-level setting can't override it.
    await ensureSetting("enableSignup", "false");
    await ensureSetting("defaultGroup", group.id);
    for (const groupId of [GLOBAL, group.id]) {
        await ensureSetting("enableDefaultListCreation", "false", groupId);
        await ensureSetting("claims.showForOwner", "false", groupId);
        await ensureSetting("claims.showName", "true", groupId);
    }

    const passwords: [string, string][] = [];
    for (const h of family.households) {
        const password = await ensureHousehold(h, group.id);
        if (password) passwords.push([h.username, password]);
    }

    if (passwords.length) {
        console.log("\nTemporary passwords (shown only once; households can change theirs on the Account page):");
        for (const [username, password] of passwords) console.log(`  ${username.padEnd(20)} ${password}`);
    } else {
        console.log("\nNo new households, so no new passwords.");
    }
};

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e instanceof Error ? e.message : e);
        await prisma.$disconnect();
        process.exit(1);
    });

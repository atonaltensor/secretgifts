// Per-person list avatars, matched by name: a list called "Emma" uses emma.svg (or .png/.webp/.jpg).
// The images are real family photos/art, so they never go in git or the Docker image: they're read
// at runtime from LIST_AVATAR_DIR (default images/christmas_avatars, relative to the working dir).
// In production, mount a volume there. If the folder is missing, lists just keep their icons.
import { env } from "$env/dynamic/private";
import { readdir } from "node:fs/promises";
import path from "node:path";

// Earlier extensions win when one name has several files (svg stays crisp at any size).
const EXTENSIONS = [".svg", ".webp", ".png", ".jpg", ".jpeg"] as const;
export const AVATAR_CONTENT_TYPES: Record<string, string> = {
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
};

export const avatarDir = () => path.resolve(env.LIST_AVATAR_DIR || "images/christmas_avatars");

/** "Emma", " emma ", "Mary-Jo" -> "emma", "maryjo". Also used on file names, so both sides compare equal. */
const normalize = (name: string) =>
    name
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

/** Map of normalized person name -> file name, e.g. { emma: "emma.svg" }. Empty if the folder doesn't exist. */
export const getAvatarFiles = async (): Promise<Map<string, string>> => {
    let files: string[];
    try {
        files = await readdir(avatarDir());
    } catch {
        return new Map();
    }
    const byName = new Map<string, string>();
    for (const ext of EXTENSIONS) {
        for (const file of files) {
            if (path.extname(file).toLowerCase() !== ext) continue;
            const key = normalize(path.basename(file, path.extname(file)));
            if (key && !byName.has(key)) byName.set(key, file);
        }
    }
    return byName;
};

/** URL of the avatar for a list named after a person, or null when there's no matching image. */
export const avatarUrlFor = (files: Map<string, string>, listName: string | null | undefined) => {
    const file = listName ? files.get(normalize(listName)) : undefined;
    return file ? `/api/list-avatars/${encodeURIComponent(file)}` : null;
};

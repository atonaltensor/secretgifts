import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireLogin } from "$lib/server/auth";
import { AVATAR_CONTENT_TYPES, avatarDir, getAvatarFiles } from "$lib/server/list-avatars";

export const GET: RequestHandler = async ({ params }) => {
    // Family pictures: only for logged-in users (unlike /api/assets, which is public).
    requireLogin();

    // Only serve files that are actually in the avatar folder listing, so no path tricks are possible.
    const files = await getAvatarFiles();
    const file = params.file;
    if (!file || ![...files.values()].includes(file)) {
        error(404, "Not found");
    }

    const body = await readFile(path.join(avatarDir(), file));
    return new Response(body, {
        headers: {
            "Content-Type": AVATAR_CONTENT_TYPES[path.extname(file).toLowerCase()],
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            // SVGs can carry scripts; this stops them running if someone opens the file directly.
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:"
        }
    });
};

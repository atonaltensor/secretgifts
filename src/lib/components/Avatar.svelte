<script lang="ts">
    import { Avatar } from "@skeletonlabs/skeleton-svelte";
    import type { ClassValue } from "svelte/elements";

    interface Props {
        user?: {
            name: string;
            picture?: string | null;
        };
        class: ClassValue;
    }

    let { user, ...props }: Props = $props();

    // Household names look like "The Hollys — Sam & Jordan": use only the part before the dash,
    // skip words that don't start with a letter ("&"), and keep at most two initials ("TD").
    const initials = (name: string) => {
        const main = name.split(/\s+[—–-]\s+/)[0];
        const letters = main
            .split(/\s+/)
            .map((word) => word.match(/\p{L}/u)?.[0])
            .filter((letter): letter is string => !!letter)
            .slice(0, 2)
            .join("");
        return (letters || name.trim().charAt(0)).toUpperCase();
    };
</script>

<Avatar {...props}>
    <Avatar.Image src={user?.picture ? `/api/assets/${user.picture}` : null}></Avatar.Image>
    <Avatar.Fallback class="preset-filled-primary-500">
        {user ? initials(user.name) : ""}
    </Avatar.Fallback>
</Avatar>

<script lang="ts">
    import type { List, User } from "$lib/generated/prisma/client";
    import { Progress } from "@skeletonlabs/skeleton-svelte";
    import Avatar from "./Avatar.svelte";
    import { getFormatter } from "$lib/i18n";

    interface ListWithCounts extends Partial<Pick<List, "id" | "name" | "icon" | "iconColor" | "hideOwner">> {
        owner: Pick<User, "name" | "username" | "picture">;
        /** Picture matched to the list's name (see $lib/server/list-avatars); replaces the icon. */
        avatarUrl?: string | null;
        itemCount?: number;
        claimedCount?: number;
        unapprovedCount?: number;
    }

    interface Props {
        hideCount?: boolean;
        list: ListWithCounts;
        hasNewItems?: boolean;
        preventNavigate?: boolean;
    }

    const { hideCount = false, hasNewItems = false, list, preventNavigate = false }: Props = $props();
    const t = getFormatter();

    let listName = $derived(list.name || $t("wishes.wishes-for", { values: { listOwner: list.owner.name } }));
    let availableCount = $derived((list.itemCount ?? 0) - (list.claimedCount ?? 0));
    let claimedPercent = $derived(
        list.itemCount && list.itemCount > 0
            ? Math.min(100, Math.round(((list.claimedCount ?? 0) / list.itemCount) * 100))
            : 0
    );
    let iconColor = $derived(list.iconColor);
    let elementTag = $derived(preventNavigate ? "div" : "a");
    let element: HTMLElement | undefined = $state();

    $effect(() => {
        if (element && !preventNavigate) {
            (element as unknown as HTMLLinkElement).href = `/lists/${list.id}`;
        }
    });
</script>

<svelte:element
    this={elementTag}
    bind:this={element}
    class={[
        "card preset-filled-surface-100-900 inset-ring-surface-200-800 relative flex h-full flex-col overflow-hidden inset-ring",
        !preventNavigate && "card-hover"
    ]}
>
    {#if list.unapprovedCount && list.unapprovedCount > 0}
        <div
            class="preset-tonal-primary border-primary-500 rounded-tl-container rounded-tr-container flex flex-row items-center justify-center gap-x-1 border px-2 py-1"
        >
            <iconify-icon class="shrink-0" icon="ion:information-circle"></iconify-icon>
            <p class="text-xs">
                {$t("wishes.approvals-waiting", { values: { approvalCount: list.unapprovedCount } })}
            </p>
        </div>
    {/if}

    {#if hasNewItems}
        <!-- Unseen additions since this list was last opened -->
        <iconify-icon
            class="text-primary-500 absolute top-3 right-3 flex size-2.5"
            height="none"
            icon="ion:ellipse-sharp"
            width="none"
        ></iconify-icon>
    {/if}

    <div class="flex grow flex-col items-center gap-2 p-4 text-center">
        <!-- Portrait: the person's avatar, or the list's icon on its color -->
        <div
            style="background-color: {iconColor};"
            class="text-surface-50 ring-primary-500/40 flex aspect-square w-20 shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold shadow-md ring-4 md:w-24"
            class:bg-primary-500={!iconColor}
        >
            {#if list.avatarUrl}
                <img class="size-full object-cover" alt="" src={list.avatarUrl} />
            {:else}
                <iconify-icon class="text-4xl md:text-5xl" icon={"ion:" + (list.icon ?? "gift")}></iconify-icon>
            {/if}
        </div>

        <span class="text-primary-900-100 line-clamp-2 text-lg font-bold md:text-xl" data-testid="list-name">
            {listName}
        </span>

        {#if !list.hideOwner}
            <div class="flex max-w-full items-center justify-center gap-1.5 text-xs md:text-sm">
                <Avatar class="text-tiny size-5 shrink-0" user={list.owner} />
                <span
                    class="text-surface-800-200 line-clamp-2 text-left"
                    data-testid="list-owner"
                    title={list.owner.name}
                >
                    {list.owner.name}
                </span>
            </div>
        {/if}

        <!-- mt-auto lines up the counts along the bottom of each row of cards -->
        <div class="mt-auto flex items-center justify-center gap-1.5 pt-1 text-sm" data-testid="item-count">
            {#if hideCount}
                <iconify-icon icon="ion:gift"></iconify-icon>
                <span>{$t("wishes.items-requested", { values: { itemCount: list.itemCount } })}</span>
            {:else}
                <Progress class="relative w-fit" value={claimedPercent}>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <iconify-icon
                            class="flex size-2.5 items-center justify-center"
                            height="none"
                            icon="ion:gift"
                            width="none"
                        ></iconify-icon>
                    </div>
                    <Progress.Circle class="[--size:--spacing(5)] [--thickness:calc(var(--size)/8)]">
                        <Progress.CircleTrack />
                        <Progress.CircleRange />
                    </Progress.Circle>
                </Progress>
                <span class="font-bold">{$t("wishes.items-available", { values: { availableCount } })}</span>
            {/if}
        </div>
    </div>
</svelte:element>

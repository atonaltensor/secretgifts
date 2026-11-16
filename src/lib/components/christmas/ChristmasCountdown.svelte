<script lang="ts">
    // Home-page "N days until Christmas" line, with a switch for the snowfall.
    import { daysUntilChristmas } from "$lib/christmas";
    import { getFormatter } from "$lib/i18n";
    import { LocalStorage } from "$lib/local-storage.svelte";
    import { onMount } from "svelte";
    import { scale } from "svelte/transition";
    import Snowfall from "./Snowfall.svelte";

    const t = getFormatter();
    const snow = new LocalStorage("snowfall", true);

    // A playful "are you sure?" bubble when someone turns the snow off.
    const BUBBLE_MS = 3000;
    let showWhy = $state(false);
    let whyTimer: ReturnType<typeof setTimeout> | undefined;

    const toggleSnow = () => {
        snow.current = !snow.current;
        clearTimeout(whyTimer);
        showWhy = !snow.current;
        if (showWhy) whyTimer = setTimeout(() => (showWhy = false), BUBBLE_MS);
    };

    onMount(() => () => clearTimeout(whyTimer));

    // Computed in the browser so the count uses the visitor's own date, not the server's.
    let days: number | null = $state(null);
    onMount(() => {
        days = daysUntilChristmas();
    });
</script>

<div class="flex items-center justify-between gap-2 pb-4 print:hidden" data-testid="christmas-countdown">
    <p class="text-tertiary-700-300 text-lg font-semibold md:text-xl">
        {#if days === 0}
            {$t("app.christmas-today")}
        {:else if days !== null}
            {$t("app.christmas-countdown", { values: { days } })}
        {/if}
    </p>
    <div class="relative">
        <button class="btn btn-sm preset-tonal-surface" aria-pressed={snow.current} onclick={toggleSnow}>
            <iconify-icon icon="ion:snow-outline"></iconify-icon>
            <span>{snow.current ? $t("app.snow-off") : $t("app.snow-on")}</span>
        </button>
        <div class="absolute top-full right-0 z-10 mt-2" aria-live="polite" role="status">
            {#if showWhy}
                <div
                    class="card preset-filled-surface-50-950 border-surface-200-800 relative w-max max-w-56 border px-3 py-2 text-sm shadow-lg"
                    data-testid="snow-why-bubble"
                    transition:scale={{ start: 0.8, duration: 150 }}
                >
                    <!-- speech-bubble tail pointing up at the button -->
                    <span
                        class="bg-surface-50-950 border-surface-200-800 absolute -top-1.5 right-5 size-3 rotate-45 border-t border-l"
                        aria-hidden="true"
                    ></span>
                    {$t("app.snow-why")}
                </div>
            {/if}
        </div>
    </div>
</div>

{#if snow.current}
    <Snowfall />
{/if}

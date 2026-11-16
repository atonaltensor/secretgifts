<script lang="ts">
    // A string of twinkling Christmas lights, hung along the top edge of its (relative) parent.
    // CSS-only; the bulbs stay lit but still for people who prefer reduced motion.
    const BULBS = 12;
    const COLORS = [
        "var(--color-primary-500)",
        "var(--color-tertiary-400)",
        "var(--color-secondary-500)",
        "#3b82f6" // a blue bulb, for variety
    ];

    const bulbs = Array.from({ length: BULBS }, (_, i) => ({
        color: COLORS[i % COLORS.length],
        // Alternate up/down so the wire looks like it sags between hooks.
        drop: i % 2 === 0 ? 0 : 4,
        delay: -((i * 7) % 11) / 5
    }));
</script>

<div class="lights" aria-hidden="true" data-testid="string-lights">
    {#each bulbs as bulb, i (i)}
        <span style:--bulb={bulb.color} style:--drop="{bulb.drop}px" style:animation-delay="{bulb.delay}s"></span>
    {/each}
</div>

<style>
    .lights {
        position: absolute;
        top: -0.4rem;
        right: 1rem;
        left: 1rem;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        /* the wire */
        border-top: 2px solid color-mix(in oklab, var(--color-surface-500) 70%, transparent);
    }

    span {
        position: relative;
        width: 0.5rem;
        height: 0.75rem;
        margin-top: var(--drop);
        border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
        background: var(--bulb);
        box-shadow: 0 0 0.4rem 0.1rem color-mix(in oklab, var(--bulb) 70%, transparent);
        animation: twinkle 2.2s ease-in-out infinite;
    }

    /* the little socket on top of each bulb */
    span::before {
        content: "";
        position: absolute;
        top: -0.2rem;
        left: 50%;
        width: 0.3rem;
        height: 0.25rem;
        transform: translateX(-50%);
        border-radius: 1px;
        background: var(--color-surface-500);
    }

    @keyframes twinkle {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.45;
            box-shadow: none;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        span {
            animation: none;
        }
    }
</style>

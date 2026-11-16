<script lang="ts">
    // CSS-only snowfall. Hidden for people who prefer reduced motion. Toggled from ChristmasCountdown.
    const FLAKES = 30;

    // Deterministic "random" values so the server and browser render the same markup.
    const flakes = Array.from({ length: FLAKES }, (_, i) => ({
        left: (i * 37) % 100,
        size: 0.5 + ((i * 5) % 7) / 10,
        duration: 9 + ((i * 7) % 10),
        delay: -((i * 13) % 19),
        sway: 8 + ((i * 3) % 5) * 4,
        opacity: 0.5 + ((i * 11) % 5) / 10
    }));
</script>

<div class="snowfall" aria-hidden="true" data-testid="snowfall">
    {#each flakes as flake, i (i)}
        <span
            style:left="{flake.left}%"
            style:font-size="{flake.size}rem"
            style:opacity={flake.opacity}
            style:animation-duration="{flake.duration}s"
            style:animation-delay="{flake.delay}s"
            style:--sway="{flake.sway}px"
        >
            ❄
        </span>
    {/each}
</div>

<style>
    .snowfall {
        position: fixed;
        inset: 0;
        z-index: 5;
        overflow: hidden;
        pointer-events: none;
    }

    span {
        position: absolute;
        top: -2rem;
        color: var(--color-secondary-300);
        animation-name: fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }

    :global([data-mode="dark"]) span {
        color: var(--color-surface-50);
    }

    @keyframes fall {
        0% {
            transform: translate(0, 0) rotate(0deg);
        }
        25% {
            transform: translate(var(--sway), 27vh) rotate(90deg);
        }
        50% {
            transform: translate(0, 54vh) rotate(180deg);
        }
        75% {
            transform: translate(calc(var(--sway) * -1), 81vh) rotate(270deg);
        }
        100% {
            transform: translate(0, 108vh) rotate(360deg);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .snowfall {
            display: none;
        }
    }

    @media print {
        .snowfall {
            display: none;
        }
    }
</style>

<script lang="ts" module>
    export type SnowmanMood = "watching" | "hiding" | "peeking";
</script>

<script lang="ts">
    // A snowman who politely covers his eyes while you type your password,
    // and peeks with one eye when you press "show password". Decorative only.
    interface Props {
        mood: SnowmanMood;
        class?: string;
    }

    const { mood, class: className = "" }: Props = $props();

    // Arms point straight up in their own coordinates and rotate around the shoulder.
    // These angles land each mitten either out to the side, or on top of an eye.
    const ARM_OUT = 61;
    const ARM_ON_EYE = 20.6;
    const leftArm = $derived(mood === "watching" || mood === "peeking" ? -ARM_OUT : ARM_ON_EYE);
    const rightArm = $derived(mood === "watching" ? ARM_OUT : -ARM_ON_EYE);
</script>

<svg
    class={["snowman", className]}
    aria-hidden="true"
    data-mood={mood}
    data-testid="peeking-snowman"
    viewBox="0 0 64 86"
>
    <!-- body and head -->
    <circle class="snow" cx="32" cy="64" r="20" />
    <circle class="snow" cx="32" cy="30" r="14" />
    <!-- buttons -->
    <circle class="coal" cx="32" cy="58" r="1.6" />
    <circle class="coal" cx="32" cy="66" r="1.6" />
    <circle class="coal" cx="32" cy="74" r="1.6" />
    <!-- hat -->
    <rect class="hat" height="4" rx="1" width="24" x="20" y="14" />
    <rect class="hat" height="13" rx="1.5" width="16" x="24" y="2" />
    <rect class="band" height="3" width="16" x="24" y="11" />
    <!-- face: the left eye goes wide when he peeks -->
    <circle class="coal" cx="27" cy="28" r={mood === "peeking" ? 2.8 : 2} />
    <circle class="coal" cx="37" cy="28" r="2" />
    <path class="carrot" d="M32 31 L42 33.5 L32 34.5 Z" />
    <path class="smile" d="M26.5 37.5 Q32 41 37.5 37.5" />
    <!-- arms: stick + mitten, rotating around each shoulder -->
    <g style:transform="rotate({leftArm}deg)" style:transform-origin="18px 52px" class="arm">
        <line class="stick" x1="18" x2="18" y1="52" y2="29" />
        <circle class="mitten" cx="18" cy="27" r="4.8" />
    </g>
    <g style:transform="rotate({rightArm}deg)" style:transform-origin="46px 52px" class="arm">
        <line class="stick" x1="46" x2="46" y1="52" y2="29" />
        <circle class="mitten mitten-right" cx="46" cy="27" r="4.8" />
    </g>
</svg>

<style>
    .snowman {
        overflow: visible;
    }

    .snow {
        fill: #fff;
        stroke: var(--color-surface-300);
        stroke-width: 1;
    }

    .coal {
        fill: var(--color-surface-950);
    }

    .hat {
        fill: #1c1917;
        /* a light outline keeps the black hat visible on dark backgrounds */
        stroke: var(--color-surface-400);
        stroke-width: 0.8;
    }

    .band {
        fill: var(--color-primary-500);
    }

    .carrot {
        fill: #f97316;
    }

    .smile {
        fill: none;
        stroke: var(--color-surface-950);
        stroke-width: 1.4;
        stroke-linecap: round;
    }

    .stick {
        stroke: #7c4a1e;
        stroke-width: 2.2;
        stroke-linecap: round;
    }

    .mitten {
        fill: var(--color-primary-500);
    }

    .mitten-right {
        fill: var(--color-secondary-500);
    }

    .arm {
        transform-box: view-box;
        transition: transform 0.25s ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
        .arm {
            transition: none;
        }
    }
</style>

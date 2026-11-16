// A short burst of festive sparkles, shown when someone taps "I'll get this". No dependencies.

const PIECES = ["✨", "⭐", "🎁", "🎄", "❄️", "✨"];
const COUNT = 18;
const DURATION_MS = 1100;

export function celebrate() {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden";
    document.body.appendChild(layer);

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    for (let i = 0; i < COUNT; i++) {
        const piece = document.createElement("span");
        piece.textContent = PIECES[i % PIECES.length];
        piece.style.cssText = `position:absolute;left:${originX}px;top:${originY}px;font-size:${1 + Math.random()}rem`;
        layer.appendChild(piece);

        const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 90 + Math.random() * 110;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        piece.animate(
            [
                { transform: "translate(-50%, -50%) scale(0.3)", opacity: 1 },
                {
                    transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`,
                    opacity: 1,
                    offset: 0.6
                },
                {
                    transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 60}px)) scale(0.8) rotate(${dx}deg)`,
                    opacity: 0
                }
            ],
            { duration: DURATION_MS, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }
        );
    }

    setTimeout(() => layer.remove(), DURATION_MS + 100);
}

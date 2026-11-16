// Family-registry settings that change each year. See docs/christmas-plan.md.

/** Shown in the nav bar, the browser tab and the installed app name. */
export const SITE_TITLE = "Doucettes' Christmas 2026";

/** Short name for the installed app's home-screen icon. */
export const SITE_SHORT_TITLE = "Christmas 2026";

/** Browser/PWA chrome color: the theme's deep red (primary-700). */
export const THEME_COLOR = "#a20519";

/** The day lists lock, as YYYY-MM-DD. The banner counts down to midnight (local time) at the start of this day. */
export const LISTS_LOCK_DATE = "2026-12-01";

export const listsLockDate = () => {
    const [year, month, day] = LISTS_LOCK_DATE.split("-").map(Number);
    return new Date(year, month - 1, day);
};

/** Whole days from `now` until the next Christmas Day (0 on Christmas Day itself), in local time. */
export const daysUntilChristmas = (now = new Date()) => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let christmas = new Date(today.getFullYear(), 11, 25);
    if (today > christmas) christmas = new Date(today.getFullYear() + 1, 11, 25);
    return Math.round((christmas.getTime() - today.getTime()) / 86_400_000);
};

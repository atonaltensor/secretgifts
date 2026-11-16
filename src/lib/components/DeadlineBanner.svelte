<script lang="ts">
    import { listsLockDate } from "$lib/christmas";
    import { getFormatter } from "$lib/i18n";

    interface Props {
        locale: string;
    }

    const { locale }: Props = $props();
    const t = getFormatter();

    const lockDate = listsLockDate();
    const locked = new Date() >= lockDate;
    const formattedDate = $derived(lockDate.toLocaleDateString(locale, { month: "long", day: "numeric" }));
</script>

<div
    class="card preset-tonal-secondary border-secondary-500 mb-4 border px-4 py-2 text-center font-semibold print:hidden"
    data-testid="deadline-banner"
    role="status"
>
    {#if locked}
        {$t("app.deadline-after")}
    {:else}
        {$t("app.deadline-before", { values: { date: formattedDate } })}
    {/if}
</div>

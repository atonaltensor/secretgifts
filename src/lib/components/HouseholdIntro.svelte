<script lang="ts">
    import { getFormatter } from "$lib/i18n";
    import { LocalStorage } from "$lib/local-storage.svelte";
    import Alert from "./Alert.svelte";

    interface Props {
        /** True when the logged-in household hasn't created any lists yet. */
        firstVisit: boolean;
    }

    const { firstVisit }: Props = $props();
    const t = getFormatter();
    const dismissed = new LocalStorage("householdIntroDismissed", false);
</script>

{#snippet steps(cls: string)}
    <ul class="space-y-1 {cls}">
        <li>{$t("wishes.household-intro-own")}</li>
        <li>{$t("wishes.household-intro-claim")}</li>
    </ul>
{/snippet}

{#if firstVisit}
    <div class="card preset-tonal-primary border-primary-500 mb-4 border p-6 text-center" data-testid="household-intro">
        <p class="pb-2 text-xl font-bold md:text-2xl">{$t("wishes.household-intro-title")}</p>
        {@render steps("md:text-lg")}
    </div>
{:else if !dismissed.current}
    <div data-testid="household-intro">
        <Alert noicon title={$t("wishes.household-intro-title")} type="info">
            {@render steps("")}
            {#snippet actions(buttonVariant)}
                <button class="btn btn-sm {buttonVariant}" onclick={() => (dismissed.current = true)}>
                    {$t("wishes.household-intro-dismiss")}
                </button>
            {/snippet}
        </Alert>
    </div>
{/if}

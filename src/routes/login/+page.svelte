<script lang="ts">
    import { enhance } from "$app/forms";
    import { page } from "$app/state";
    import PasswordInput from "$lib/components/PasswordInput.svelte";
    import type { PageProps } from "./$types";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import Alert from "$lib/components/Alert.svelte";
    import { getFormatter } from "$lib/i18n";
    import { resolve } from "$app/paths";
    import { toaster } from "$lib/components/toaster";
    import { LocalStorage } from "$lib/local-storage.svelte";
    import Snowfall from "$lib/components/christmas/Snowfall.svelte";
    import StringLights from "$lib/components/christmas/StringLights.svelte";
    import PeekingSnowman, { type SnowmanMood } from "$lib/components/christmas/PeekingSnowman.svelte";

    const { data, form }: PageProps = $props();
    const t = getFormatter();

    // Christmas whimsy (docs/christmas-plan.md #8): snow, a random greeting, and a snowman
    // who covers his eyes while you type your password.
    const snow = new LocalStorage("snowfall", true);
    const GREETINGS = 4;
    let greeting = $state(1);
    let greetingReady = $state(false);
    let passwordFocused = $state(false);
    let passwordVisible = $state(false);
    const snowmanMood: SnowmanMood = $derived(passwordVisible ? "peeking" : passwordFocused ? "hiding" : "watching");

    let signingIn = $state(false);
    let oAuthError: Record<string, string> | undefined = $state();
    onMount(async () => {
        // Picked in the browser so the server-rendered page and hydration agree.
        greeting = 1 + Math.floor(Math.random() * GREETINGS);
        greetingReady = true;
        if (data.isCallback) {
            const resp = await fetch("/login/oidc/callback", {
                method: "POST",
                body: JSON.stringify({ url: page.url })
            });
            if (!resp.ok) {
                oAuthError = await resp.json();
                goto(
                    resolve("/login") +
                        "?" +
                        new URLSearchParams({ error: oAuthError?.message || $t("general.oops") }).toString()
                );
            } else if (resp.redirected) {
                goto(resp.url, { invalidateAll: true });
            }
        }
    });
</script>

{#if snow.current}
    <Snowfall />
{/if}

<div class="flex flex-col items-center space-y-4">
    <h1 class="h2 text-center">{$t("auth.login-heading")}</h1>
    <p
        class={[
            "text-tertiary-700-300 text-center text-lg transition-opacity duration-500",
            !greetingReady && "opacity-0"
        ]}
        data-testid="login-greeting"
    >
        {$t(`auth.login-greeting-${greeting}`)}
    </p>

    <form
        class="relative mt-24 w-80"
        method="POST"
        use:enhance={(form) => {
            signingIn = true;
            return async ({ result, update }) => {
                signingIn = false;

                if (result.type === "failure") {
                    form.formElement.reset();
                } else if (result.type === "error") {
                    toaster.error({ description: result.error });
                }
                await update();
            };
        }}
    >
        <PeekingSnowman class="absolute right-4 bottom-[calc(100%-0.5rem)] z-10 w-[5.5rem]" mood={snowmanMood} />
        <StringLights />
        <div
            class="rounded-container card preset-filled-surface-100-900 border-surface-200-800 flex flex-col space-y-4 border p-4"
        >
            {#if data.isCallback}
                <div class="flex flex-col items-center justify-center space-y-4">
                    <span class="loading loading-spinner w-8 md:w-12"></span>
                    <span class="text-lg md:text-xl">{$t("auth.authenticating")}</span>
                </div>
            {:else}
                {#if data.enableLogin}
                    <label class="label" for="username">
                        <span>{$t("auth.login-username")}</span>
                        <input
                            id="username"
                            name="username"
                            class={["input", (form?.incorrect || form?.error) && "input-invalid"]}
                            autocapitalize="off"
                            autocomplete="username"
                            required
                            type="text"
                        />
                        {#if form?.errors?.username}
                            <span class="text-invalid">
                                {form.errors.username[0]}
                            </span>
                        {/if}
                    </label>

                    <div class="relative flex flex-col space-y-4">
                        <PasswordInput
                            id="password"
                            name="password"
                            error={form?.incorrect || form?.error}
                            label={$t("auth.password")}
                            onblur={() => (passwordFocused = false)}
                            onfocus={() => (passwordFocused = true)}
                            required
                            bind:visible={passwordVisible}
                        />

                        {#if form?.incorrect}
                            <span class="text-invalid">
                                {$t("auth.login-invalid")}
                            </span>
                        {/if}
                        {#if form?.errors?.password}
                            <span class="text-invalid">
                                {form.errors.password[0]}
                            </span>
                        {/if}

                        <div class="flex items-center justify-center gap-x-4">
                            <button class="preset-filled-primary-500 btn whitespace-nowrap" disabled={signingIn}>
                                {#if signingIn}
                                    <span class="loading loading-spinner loading-xs"></span>
                                    <span>{$t("auth.login-checking")}</span>
                                {:else}
                                    <span>{$t("auth.login-button")}</span>
                                {/if}
                            </button>
                            {#if data.enableSignup}
                                <a class="anchor" href="/signup">{$t("auth.create-an-account")}</a>
                            {/if}
                        </div>

                        <a
                            class="anchor absolute top-0 mt-0! pt-0.5 text-sm ltr:right-0 rtl:left-0"
                            href="/forgot-password"
                        >
                            {$t("auth.forgot-password")}
                        </a>
                    </div>
                {/if}
                {#if data.oidcConfig?.ready}
                    {#if data.enableLogin}
                        <div class="-mt-4 flex w-full items-center justify-center">
                            <hr class="hr my-2 h-px w-3/4" />
                            <span class="preset-filled-surface-100-900 absolute left-1/2 -translate-x-1/2 px-2">
                                {$t("auth.or")}
                            </span>
                        </div>
                    {/if}
                    <div class="flex justify-center">
                        <button
                            class="preset-filled-primary-500 btn"
                            disabled={signingIn}
                            onclick={() => window.location.assign(`/login/oidc${page.url.search}`)}
                            type="button"
                        >
                            {$t("auth.sign-in-with", { values: { provider: data.oidcConfig.providerName || "OAuth" } })}
                        </button>
                    </div>
                {/if}
            {/if}
        </div>
    </form>
    {#if data.error}
        <Alert class="w-80 md:w-1/2" noicon title={$t("errors.oidc-error")} type="error">
            <pre class="text-wrap">{data.error}</pre>
        </Alert>
    {/if}
</div>

<svelte:head>
    <title>{$t("auth.sign-in")}</title>
</svelte:head>

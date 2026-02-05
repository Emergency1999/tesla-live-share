import { SvelteURL } from "svelte/reactivity"

export function shortToLink(linkShort: string) {
	const urlLink = new SvelteURL(window.location.href.split("?")[0])
	urlLink.pathname = "/share"
	urlLink.searchParams.set("s", linkShort)
	return urlLink.toString()
}

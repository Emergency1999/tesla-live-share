import adapter from "@sveltejs/adapter-node"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$convex: "src/convex/_generated",
		},
		version: {
			name: process.env.npm_package_version,
		},
	},
}

export default config

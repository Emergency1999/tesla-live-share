<script lang="ts">
	import { authClient } from "$lib/auth-client"

	const handleLogout = async () => {
		await authClient.signOut()
	}
</script>

<button onclick={handleLogout} class="logout-btn">Logout</button>

<style>
	.logout-btn {
		padding: 0.5rem 1rem;
		background-color: #ef4444;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.logout-btn:hover {
		background-color: #dc2626;
	}

	.logout-btn:active {
		background-color: #b91c1c;
	}
</style>

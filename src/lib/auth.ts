import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import { setAuthToken } from './convex';

// OIDC configuration from environment variables
const AUTH_ISSUER_URL = import.meta.env.VITE_AUTH_ISSUER_URL as string;
const AUTH_CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID as string;
const AUTH_REDIRECT_URI = import.meta.env.VITE_AUTH_REDIRECT_URI as string;

// Auth state
export const user = writable<{ name?: string; email?: string } | null>(null);
export const isLoading = writable<boolean>(true);

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Initialize auth state from storage
export function initAuth() {
	if (!browser) return;
	
	const storedToken = localStorage.getItem(TOKEN_KEY);
	const storedUser = localStorage.getItem(USER_KEY);
	
	if (storedToken && storedUser) {
		try {
			const userData = JSON.parse(storedUser);
			user.set(userData);
			setAuthToken(storedToken);
		} catch {
			// Invalid stored data, clear it
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(USER_KEY);
		}
	}
	
	isLoading.set(false);
}

// Start OIDC login flow
export function login() {
	if (!browser) return;
	
	// Generate a random state for CSRF protection
	const state = generateRandomString(32);
	const nonce = generateRandomString(32);
	
	sessionStorage.setItem('auth_state', state);
	sessionStorage.setItem('auth_nonce', nonce);
	
	// Build the authorization URL
	const params = new URLSearchParams({
		client_id: AUTH_CLIENT_ID,
		redirect_uri: AUTH_REDIRECT_URI,
		response_type: 'id_token token',
		scope: 'openid profile email',
		state,
		nonce,
	});
	
	const authUrl = `${AUTH_ISSUER_URL}/authorize?${params.toString()}`;
	window.location.href = authUrl;
}

// Handle the OIDC callback
export async function handleCallback(): Promise<boolean> {
	if (!browser) return false;
	
	// Check for hash fragment (implicit flow)
	const hash = window.location.hash.substring(1);
	if (!hash) return false;
	
	const params = new URLSearchParams(hash);
	const accessToken = params.get('access_token');
	const idToken = params.get('id_token');
	const state = params.get('state');
	const error = params.get('error');
	
	if (error) {
		console.error('Auth error:', error, params.get('error_description'));
		return false;
	}
	
	// Verify state
	const storedState = sessionStorage.getItem('auth_state');
	if (state !== storedState) {
		console.error('State mismatch');
		return false;
	}
	
	sessionStorage.removeItem('auth_state');
	sessionStorage.removeItem('auth_nonce');
	
	if (!idToken) {
		console.error('No ID token received');
		return false;
	}
	
	// Decode the ID token to get user info
	try {
		const payload = parseJwt(idToken);
		// Use name claim, or preferred_username, or email prefix, or subject ID as fallback
		const defaultName = payload.email 
			? String(payload.email).split('@')[0] 
			: payload.sub 
				? `User-${String(payload.sub).slice(0, 8)}` 
				: 'Unknown User';
		const userData = {
			name: String(payload.name || payload.preferred_username || defaultName),
			email: payload.email ? String(payload.email) : undefined,
		};
		
		// Store auth data
		localStorage.setItem(TOKEN_KEY, idToken);
		localStorage.setItem(USER_KEY, JSON.stringify(userData));
		
		// Update stores
		user.set(userData);
		setAuthToken(idToken);
		
		// Clear the hash from URL
		window.history.replaceState(null, '', window.location.pathname);
		
		return true;
	} catch (e) {
		console.error('Failed to parse token:', e);
		return false;
	}
}

// Logout
export function logout() {
	if (!browser) return;
	
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
	user.set(null);
	setAuthToken(null);
}

// Helper to generate random string
function generateRandomString(length: number): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const randomValues = new Uint8Array(length);
	crypto.getRandomValues(randomValues);
	for (let i = 0; i < length; i++) {
		result += chars[randomValues[i] % chars.length];
	}
	return result;
}

// Helper to parse JWT
function parseJwt(token: string): Record<string, unknown> {
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(
		atob(base64)
			.split('')
			.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
			.join('')
	);
	return JSON.parse(jsonPayload);
}

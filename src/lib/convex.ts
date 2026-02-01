import { ConvexClient } from "convex/browser";
import { writable, type Readable } from "svelte/store";
import type { FunctionReference, FunctionReturnType, FunctionArgs } from "convex/server";

// Environment variable for Convex URL
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string;

// Create the Convex client
export const convexClient = new ConvexClient(CONVEX_URL);

// Store for authentication state
export const isAuthenticated = writable<boolean>(false);
export const authToken = writable<string | null>(null);

// Set auth token on the client
export function setAuthToken(token: string | null) {
	if (token) {
		convexClient.setAuth(async () => token);
		authToken.set(token);
		isAuthenticated.set(true);
	} else {
		convexClient.setAuth(async () => null);
		authToken.set(null);
		isAuthenticated.set(false);
	}
}

// Create a reactive store for a Convex query
export function useQuery<Query extends FunctionReference<"query">>(
	query: Query,
	args: FunctionArgs<Query>
): Readable<FunctionReturnType<Query> | undefined> {
	const store = writable<FunctionReturnType<Query> | undefined>(undefined);
	
	const subscribe = (set: (value: FunctionReturnType<Query> | undefined) => void) => {
		const unsubscribe = convexClient.onUpdate(query, args, (result) => {
			set(result);
		});
		
		return () => {
			unsubscribe();
		};
	};
	
	return { subscribe };
}

// Mutation helper
export async function useMutation<Mutation extends FunctionReference<"mutation">>(
	mutation: Mutation,
	args: FunctionArgs<Mutation>
): Promise<FunctionReturnType<Mutation>> {
	return await convexClient.mutation(mutation, args);
}

// Action helper  
export async function useAction<Action extends FunctionReference<"action">>(
	action: Action,
	args: FunctionArgs<Action>
): Promise<FunctionReturnType<Action>> {
	return await convexClient.action(action, args);
}

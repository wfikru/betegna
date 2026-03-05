import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// Aggressive caching to reduce Firebase reads
			staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
			gcTime: 30 * 60 * 1000,   // 30 minutes - keep in cache for reuse
		},
	},
});
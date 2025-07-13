import { QueryClient } from "@tanstack/react-query";
import  authService  from "./auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = authService.getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const authHeaders = authService.getAuthHeaders();
  
  const res = await fetch(queryKey[0] as string, {
    headers: authHeaders,
    credentials: "include",
  });

  if (res.status === 401 || res.status === 403) {
    // Token expired, clear auth and redirect to login
    authService.logout();
    window.dispatchEvent(new CustomEvent('auth-error'));
    throw new Error("Session expired. Please login again.");
  }

  await throwIfResNotOk(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

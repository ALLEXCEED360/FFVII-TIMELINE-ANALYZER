import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";
import { retryWhileWaking, wakeRetryDelay } from "./api/waking";
import { routes } from "./app/routes";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    // The data only changes on deploy, so there's no need to refetch while the page is open; a
    // failed request is tried again while the API may still be waking (api/waking.ts).
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: retryWhileWaking,
      retryDelay: wakeRetryDelay,
    },
  },
});

const router = createBrowserRouter(routes);

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from index.html");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";
import { routes } from "./app/routes";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    // The data only changes on deploy, so there's no need to refetch while the page is open.
    queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
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

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupWorker } from "msw/browser";
import { handlers } from "./mocks";
import { App } from "./App";
import "./styles.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true } } });
async function bootstrap() {
  try {
    await setupWorker(...handlers).start({ onUnhandledRequest: "bypass" });
  } catch (error) {
    console.error("MSW failed to start; the game remains available without mocked ranking requests.", error);
  }
  ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></React.StrictMode>);
}
void bootstrap();

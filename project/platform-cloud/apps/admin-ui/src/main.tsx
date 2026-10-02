import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminApp } from "./App";
import { ReviewQueue } from "./pages/ReviewQueue";
import { ModuleDetail } from "./pages/ModuleDetail";
import { AccountsPage } from "./pages/Accounts";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminApp />}>
            <Route index element={<ReviewQueue />} />
            <Route path="modules/:id/:v" element={<ModuleDetail />} />
            <Route path="accounts" element={<AccountsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
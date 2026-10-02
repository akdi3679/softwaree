import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PortalApp } from "./App";
import { Dashboard } from "./pages/Dashboard";
import { Team } from "./pages/Team";
import { Devices } from "./pages/Devices";
import { Billing } from "./pages/Billing";
import { AuditLogPage } from "./pages/AuditLog";
import { Login } from "./pages/Login";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PortalApp />}>
            <Route index element={<Dashboard />} />
            <Route path="team" element={<Team />} />
            <Route path="devices" element={<Devices />} />
            <Route path="billing" element={<Billing />} />
            <Route path="audit" element={<AuditLogPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
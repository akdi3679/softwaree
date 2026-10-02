import { api } from "../lib/api";

export function Login() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const res = await fetch((import.meta.env.VITE_API_URL ?? "http://localhost:8787") + "/v1/accounts/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      alert("Login failed");
      return;
    }
    const data = (await res.json()) as { token?: string; session_token?: string };
    localStorage.setItem("portal_session", data.token ?? data.session_token ?? "");
    window.location.href = "/";
    void api;
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <form onSubmit={onSubmit} style={{ background: "white", padding: 24, borderRadius: 6, width: 340, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Sign in</h1>
        <input name="email" type="email" placeholder="Email" required style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 4, marginBottom: 8 }} />
        <input name="password" type="password" placeholder="Password" required style={{ width: "100%", padding: 8, border: "1px solid #d1d5db", borderRadius: 4, marginBottom: 12 }} />
        <button type="submit" style={{ width: "100%", padding: "10px 12px", background: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Sign in
        </button>
      </form>
    </div>
  );
}
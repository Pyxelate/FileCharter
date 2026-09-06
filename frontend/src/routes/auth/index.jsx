import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HardDrive, Loader2 } from "lucide-react";
import { useState } from "react";
import { BACKEND_URL } from "@/lib/getConfigs.ts";

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isSignup = tab === "signup";

  function switchTab(next) {
    setTab(next);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const endpoint = isSignup ? "signup" : "login";
    try {
      const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        navigate({ to: "/" });
        return;
      }

      if (response.status === 401) {
        setError("Invalid username or password.");
      } else if (response.status === 409) {
        setError("That username is already taken.");
      } else if (response.status === 400) {
        setError("Username and password are required.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const tabClass = (active) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition cursor-pointer ${
      active
        ? "bg-card text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <HardDrive className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">FileCharter</h1>
          <p className="text-sm text-muted-foreground">
            {isSignup
              ? "Create an account to get started."
              : "Sign in to your files."}
          </p>
        </div>

        <div className="mb-5 flex gap-1 rounded-lg border border-border bg-secondary p-1">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className={tabClass(!isSignup)}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchTab("signup")}
            className={tabClass(isSignup)}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {isSignup ? "Create account" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
// import {Button} from "@"

import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function usernameHandler(e) {
    setUsername(e.target.value);
  }

  function passwordHandler(e) {
    setPassword(e.target.value);
  }

  async function submitLogin(e) {
    e.preventDefault();

    const response = await fetch("http://localhost:8080/login", {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      method: "POST",
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });
    if (response.ok) {
      navigate({ to: "/" });
    }
  }

  async function submitSignup(e) {
    e.preventDefault();
    console.log("test");
    const response = await fetch("http://localhost:8080/signup", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });
    if (response.ok) {
      navigate({ to: "/" });
    }
  }
  return (
    <div className="absolute left-50 right-50 w-20">
      <h1>No authentication</h1>
      <div>
        <form>
          <div className={"flex flex-col"}>
            <label htmlFor="username">Username:</label>
            <input
              onChange={usernameHandler}
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
              required
            />

            <label htmlFor="password">Password:</label>
            <input
              onChange={passwordHandler}
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              required
            />

            <button onClick={submitLogin} type="submit">
              Submit
            </button>
          </div>
        </form>

        <form>
          <div className={"flex flex-col"}>
            <label htmlFor="username">Username:</label>
            <input
              onChange={usernameHandler}
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
              required
            />

            <label htmlFor="password">Password:</label>
            <input
              onChange={passwordHandler}
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              required
            />

            <button onClick={submitSignup} type="submit">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

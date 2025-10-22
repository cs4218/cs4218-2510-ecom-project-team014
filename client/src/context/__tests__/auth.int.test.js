import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth";
import axios from "axios";
import { act } from "@testing-library/react";

// Clear mocks and localStorage before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  axios.defaults.headers.common["Authorization"] = "";
});

// Helper TestComponent to access auth context state and setter
const TestComponent = () => {
  const [auth, setAuth] = useAuth();

  return (
    <>
      <pre data-testid="authState">{JSON.stringify(auth)}</pre>
      <button onClick={() => setAuth({ user: { name: "Test User" }, token: "token123" })}>
        Update Auth
      </button>
    </>
  );
};

describe("AuthProvider Integration Tests", () => {
  it("provides default auth state when no localStorage", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("authState").textContent).toBe(
      JSON.stringify({ user: null, token: "" })
    );
  });

  it("restores auth state from localStorage on mount", async () => {
    const storedData = {
      user: { name: "Stored User" },
      token: "storedtoken",
    };
    localStorage.setItem("auth", JSON.stringify(storedData));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authState").textContent).toBe(
        JSON.stringify(storedData)
      );
    });
  });

  it("updates auth state and axios header when setAuth is called", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("authState").textContent).toBe(
      JSON.stringify({ user: null, token: "" })
    );
    expect(axios.defaults.headers.common["Authorization"]).toBe("");

    // Update auth state using the button
    await act(async () => {
      screen.getByText("Update Auth").click();
    });

    expect(screen.getByTestId("authState").textContent).toBe(
      JSON.stringify({ user: { name: "Test User" }, token: "token123" })
    );
    expect(axios.defaults.headers.common["Authorization"]).toBe("token123");
  });

  it("updates axios default Authorization header when auth token changes", async () => {
    // Component that updates auth on mount with a token
    const SetTokenComponent = () => {
      const [, setAuth] = useAuth();
      React.useEffect(() => {
        setAuth({ user: { name: "User" }, token: "mytoken" });
      }, [setAuth]);
      return null;
    };

    render(
      <AuthProvider>
        <SetTokenComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe("mytoken");
    });
  });

});

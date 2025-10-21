import React from "react";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "../AdminDashboard";
import { AuthProvider } from "../../../context/auth";
import { CartProvider } from "../../../context/cart";
import { SearchProvider } from "../../../context/search";
import { MemoryRouter } from "react-router-dom";

const renderWithProviders = () => {
  const testUser = { name: "Admin User", email: "admin@example.com", phone: "123456789" };
  localStorage.setItem(
    "auth",
    JSON.stringify({ user: testUser, token: "testtoken" })
  );
  localStorage.setItem("cart", JSON.stringify([]));

  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <AdminDashboard />
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("AdminDashboard Full Integration Test", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders layout, admin menu, and admin user details from context", () => {
    renderWithProviders();

    // Admin user detail headings
    expect(screen.getByText(/Admin Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact/i)).toBeInTheDocument();

    // Admin user details
    expect(screen.getByText("Admin Name : Admin User")).toBeInTheDocument();
    expect(screen.getByText("Admin Email : admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact : 123456789")).toBeInTheDocument();

    // Optional: check for Admin Panel heading from AdminMenu
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
  });

  it("handles missing user gracefully", () => {
    // No valid user in localStorage
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <AdminDashboard />
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Name :")).toBeInTheDocument();
    expect(screen.getByText("Admin Email :")).toBeInTheDocument();
    expect(screen.getByText("Admin Contact :")).toBeInTheDocument();
  });
});

// Above tests are generated with the help of AI
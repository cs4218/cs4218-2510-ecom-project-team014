import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminMenu from "../AdminMenu";

describe("AdminMenu Integration Tests", () => {
  // Render AdminMenu inside a memory router with initial route for navigation context
const renderWithRouter = (initialRoute = "/dashboard/admin/create-category") =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AdminMenu />  {/* Always render AdminMenu */}
      <Routes>
        <Route
          path="/dashboard/admin/create-category"
          element={<div>Create Category Page</div>}
        />
        <Route
          path="/dashboard/admin/create-product"
          element={<div>Create Product Page</div>}
        />
        <Route path="/dashboard/admin/products" element={<div>Products Page</div>} />
        <Route path="/dashboard/admin/orders" element={<div>Orders Page</div>} />
      </Routes>
    </MemoryRouter>
  );

  it("renders all admin navigation links with correct href and is present", () => {
    renderWithRouter();

    expect(screen.getByText("Create Category").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category"
    );
    expect(screen.getByText("Create Product").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product"
    );
    expect(screen.getByText("Products").closest("a")).toHaveAttribute("href", "/dashboard/admin/products");
    expect(screen.getByText("Orders").closest("a")).toHaveAttribute("href", "/dashboard/admin/orders");
  });

  it("does not render the commented out Users link", () => {
    renderWithRouter();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });

  it("displays the Admin Panel heading", () => {
    renderWithRouter();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("navigates to correct route when navigation link is clicked (using MemoryRouter)", async () => {
    renderWithRouter();

    const createProductLink = screen.getByText("Create Product");
    expect(createProductLink).toBeInTheDocument();

    await act(async () => {
      createProductLink.click();
    });

    await waitFor(() => {
      expect(screen.getByText("Create Product Page")).toBeInTheDocument();
    });
  });
});

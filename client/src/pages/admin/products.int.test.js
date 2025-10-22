import { render, screen, waitFor } from "@testing-library/react";
import Products from "../../pages/admin/Products";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import toast from "react-hot-toast";
import React from "react";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

jest.mock("../../../src/components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../../src/components/AdminMenu", () => () => <div>AdminMenu</div>);

const mockProducts = [
  { _id: "1", name: "Product 1", description: "Desc 1", slug: "product-1" },
  { _id: "2", name: "Product 2", description: "Desc 2", slug: "product-2" },
];

describe("Products Page Integration", () => {
    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => { });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
  it("renders products successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    // Wait for products to render
    for (const product of mockProducts) {
      await waitFor(() => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
        expect(screen.getByText(product.description)).toBeInTheDocument();
      });
    }
  });

  it("handles server errors gracefully", async () => {
    axios.get.mockRejectedValueOnce(new Error("Server Error"));

    render(
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
    });
  });
});

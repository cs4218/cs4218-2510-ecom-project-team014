


import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateProduct from "./UpdateProduct";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

// Mock Layout and AdminMenu
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);



jest.mock("antd", () => {
  const original = jest.requireActual("antd");
  const Select = ({ children, ...props }) => {
    const { showSearch, variant, size, ...rest } = props; // remove unsupported props
    return <select data-testid={props["data-testid"]} {...rest}>{children}</select>;
  };
  Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
  return { ...original, Select };
});

// Mock react-router-dom useNavigate and useParams
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: "slug123" }),
  };
});

// Helper to render component with router
const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter initialEntries={["/dashboard/admin/product/update-product/slug123"]}>
      <Routes>
        <Route path="/dashboard/admin/product/update-product/:slug" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

describe("UpdateProduct Integration Test", () => {
  const mockProduct = {
    _id: "prod123",
    name: "Test Product",
    description: "Test description",
    price: "100",
    quantity: "10",
    shipping: "1",
    category: { _id: "cat1", name: "Category 1" },
  };

  const mockCategories = [
    { _id: "cat1", name: "Category 1" },
    { _id: "cat2", name: "Category 2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("get-product")) return Promise.resolve({ data: { product: mockProduct } });
      if (url.includes("get-category")) return Promise.resolve({ data: { success: true, category: mockCategories } });
    });
  });

  it("renders the form correctly with fetched product", async () => {
    await act(async () => {
      renderWithRouter(<UpdateProduct />);
    });

    expect(await screen.findByText(/update product/i, { selector: "h1" })).toBeInTheDocument();
    expect(await screen.findByDisplayValue(/test product/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/test description/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write a price/i)).toHaveValue(100);
    expect(screen.getByPlaceholderText(/write a quantity/i)).toHaveValue(10);
    expect(screen.getByTestId("category-select")).toBeInTheDocument();
  });

  it("updates the product successfully", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    await act(async () => {
      renderWithRouter(<UpdateProduct />);
    });

    await act(async () => {
      // Wait for initial product fetch
      await waitFor(() => screen.getByDisplayValue(/test product/i));

      // Update form values
      await userEvent.clear(screen.getByPlaceholderText(/write a name/i));
      await userEvent.type(screen.getByPlaceholderText(/write a name/i), "Updated Product");

      await userEvent.clear(screen.getByPlaceholderText(/write a price/i));
      await userEvent.type(screen.getByPlaceholderText(/write a price/i), "200");

      // Select category
      await userEvent.selectOptions(screen.getByTestId("category-select"), "cat2");

      // Click update
      await userEvent.click(screen.getByRole("button", { name: /update product/i }));
    });

    await act(async () => {
      await waitFor(() => {
        const formDataArg = axios.put.mock.calls[0][1];
        expect(formDataArg.get("name")).toBe("Updated Product");
        expect(formDataArg.get("price")).toBe("200");
        expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });
  });

  it("handles update errors gracefully", async () => {
    axios.put.mockRejectedValueOnce(new Error("Server error"));

    await act(async () => {
      renderWithRouter(<UpdateProduct />);
    });

    await act(async () => {
      await waitFor(() => screen.getByDisplayValue(/test product/i));
      await userEvent.click(screen.getByRole("button", { name: /update product/i }));
    });

    await act(async () => {
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledTimes(1);
        expect(toast.error).toHaveBeenCalledWith("something went wrong");
      });
    });
  });

  it("deletes product successfully when confirmed", async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    window.prompt = jest.fn(() => "yes");

    await act(async () => {
      renderWithRouter(<UpdateProduct />);
    });

    await act(async () => {
      await waitFor(() => screen.getByDisplayValue(/test product/i));
      await userEvent.click(screen.getByRole("button", { name: /delete product/i }));
    });

    await act(async () => {
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(`/api/v1/product/delete-product/${mockProduct._id}`);
        expect(toast.success).toHaveBeenCalledWith("Product Deleted Succfully");
      });
    });
  });

  it("does not delete product when prompt is canceled", async () => {
    window.prompt = jest.fn(() => "no");

    await act(async () => {
      renderWithRouter(<UpdateProduct />);
    });

    await act(async () => {
      await waitFor(() => screen.getByDisplayValue(/test product/i));
      await userEvent.click(screen.getByRole("button", { name: /delete product/i }));
    });

    expect(axios.delete).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});

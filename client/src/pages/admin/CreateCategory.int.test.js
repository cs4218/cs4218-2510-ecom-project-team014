import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateCategory from "../../../src/pages/admin/CreateCategory";
import axios from "axios";
import toast from "react-hot-toast";

// ✅ Mock axios
jest.mock("axios");

// ✅ Properly mock react-hot-toast default export
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../src/components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../../src/components/AdminMenu", () => () => <div>AdminMenu</div>);

describe("CreateCategory Integration Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays categories on mount", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "Electronics" }] },
    });

    render(<CreateCategory />);

    // Wait for category to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/category\/get-category/)
      );
    });

    expect(await screen.findByText("Electronics")).toBeInTheDocument();
  });

  it("creates a new category successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.post.mockResolvedValueOnce({ data: { success: true, message: "Category created" } });

    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: "New Category" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("New Category is created");
  });

  it("shows error toast when create category fails", async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    axios.post.mockRejectedValueOnce({ response: { data: { message: "Something went wrong" } } });

    render(<CreateCategory />);

    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: "Error Cat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

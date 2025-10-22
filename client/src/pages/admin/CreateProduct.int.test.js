import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateProduct from "./CreateProduct";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
    success: jest.fn(),
}));

// Mock Layout and AdminMenu
jest.mock("../../../src/components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../../src/components/AdminMenu", () => () => <div>AdminMenu</div>);


jest.mock("antd", () => {
    const original = jest.requireActual("antd");

    const Select = ({ children, showSearch, ...props }) => (
        <select data-testid="antd-select" {...props}>
            {children}
        </select>
    );

    Select.Option = ({ children, value }) => <option value={value}>{children}</option>;

    return { ...original, Select };
});

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe("CreateProduct Integration Test", () => {
    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => { });
        jest.clearAllMocks();
        axios.get.mockResolvedValue({
            data: {
                success: true,
                category: [{ _id: "1", name: "Category 1" }],
            },
        });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("renders the form correctly", async () => {
        await act(async () => {
            renderWithRouter(<CreateProduct />);
        });
        expect(screen.getByText(/create product/i, { selector: "h1" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/write a name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/write a description/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/write a price/i)).toBeInTheDocument();
    });

    it("submits the form successfully", async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        await act(async () => {
            renderWithRouter(<CreateProduct />);
        });

        // Fill in name and price
        await act(async () => {
            await userEvent.type(screen.getByPlaceholderText(/write a name/i), "Test Product");
            await userEvent.type(screen.getByPlaceholderText(/write a price/i), "100");
        });

        // Select category
        await act(async () => {
            const categorySelect = screen.getByTestId("antd-select");
            await userEvent.selectOptions(categorySelect, screen.getByText(/category 1/i));
        });

        // Click submit
        await act(async () => {
            const submitButton = screen.getByRole("button", { name: /create product/i });
            await userEvent.click(submitButton);
        });

        // Wait for axios.post to have been called with FormData
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledTimes(1);
            const formDataArg = axios.post.mock.calls[0][1];
            expect(formDataArg.get("name")).toBe("Test Product");
            expect(formDataArg.get("price")).toBe("100");
        });
    });

    it("handles server errors gracefully", async () => {
        axios.post.mockRejectedValueOnce(new Error("Server error"));

        await act(async () => {
            render(
                <MemoryRouter>
                    <CreateProduct />
                </MemoryRouter>
            );
        });

        // Wait for categories to load
        await waitFor(() => expect(screen.getByText(/category 1/i)).toBeInTheDocument());

        // Fill in form
        await act(async () => {
            await userEvent.type(screen.getByPlaceholderText(/write a name/i), "Test Product");
            await userEvent.type(screen.getByPlaceholderText(/write a price/i), "100");
            const categorySelect = screen.getByTestId("antd-select");
            //await userEvent.selectOptions(categorySelect, screen.getByText(/category 1/i));
            const submitButton = screen.getByRole("button", { name: /create product/i });
            await userEvent.click(submitButton);
        });

        // Wait for axios.post and toast.error
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalledWith("something went wrong");
        });
    });
});

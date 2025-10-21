import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminOrders from "./AdminOrders";
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

    const Select = ({ children, onChange, ...props }) => {
        const handleChange = (e) => {
            onChange && onChange(e.target.value); // pass value like AntD
        };

        // Destructure props to remove invalid HTML props
        const { bordered, showSearch, ...rest } = props;

        return (
            <select {...rest} data-testid={props["data-testid"]} onChange={handleChange}>
                {children}
            </select>
        );
    };

    Select.Option = ({ children, value }) => <option value={value}>{children}</option>;

    return { ...original, Select };
});


// Mock useAuth
jest.mock("../../context/auth", () => ({
    useAuth: () => [{ token: "mock-token" }, jest.fn()],
}));

describe("AdminOrders Integration Test", () => {
    const mockOrders = [
        {
            _id: "order1",
            status: "Not Processed",
            buyer: { name: "Alice" },
            createAt: new Date().toISOString(),
            payment: { success: true },
            products: [
                { _id: "prod1", name: "Product 1", description: "Desc1", price: 100 },
                { _id: "prod2", name: "Product 2", description: "Desc2", price: 200 },
            ],
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        axios.get.mockResolvedValue({ data: mockOrders });
        axios.put.mockResolvedValue({ data: { success: true } });
    });

    it("renders orders correctly", async () => {
        await act(async () => {
            render(<AdminOrders />);
        });

        // Wait for orders to appear
        await waitFor(() => {
            expect(screen.getByText(/all orders/i, { selector: "h1" })).toBeInTheDocument();
            expect(screen.getByText("Alice")).toBeInTheDocument();
            expect(screen.getByText("Product 1")).toBeInTheDocument();
            expect(screen.getByText("Product 2")).toBeInTheDocument();
        });
    });

    it("changes order status successfully", async () => {
        await act(async () => {
            render(<AdminOrders />);
        });

        await waitFor(() => screen.getByText("Alice"));

        const select = screen.getByRole("combobox"); // the mocked select
        await userEvent.selectOptions(select, "Shipped");

        await waitFor(() => {
            expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/order-status/order1", { status: "Shipped" });
        });
    });

    it("handles axios.get error gracefully", async () => {
        axios.get.mockRejectedValueOnce(new Error("Server error"));

        await act(async () => {
            render(<AdminOrders />);
        });

        // Wait to ensure component attempted to fetch
        await waitFor(() => {
            expect(screen.getByText(/all orders/i, { selector: "h1" })).toBeInTheDocument();
            // Orders list should be empty
            expect(screen.queryByText("Alice")).not.toBeInTheDocument();
        });
    });
});

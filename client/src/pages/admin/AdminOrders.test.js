import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import AdminOrders from './AdminOrders';

// Keep the DOM minimal and avoid router context issues
jest.mock('../../components/Layout', () => (props) => <div>{props.children}</div>);
jest.mock('../../components/AdminMenu', () => () => <nav>AdminMenu</nav>);

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock moment
jest.mock('moment', () => {
    const moment = jest.fn(() => ({
        fromNow: jest.fn(() => '2 days ago')
    }));
    return moment;
});

// Mock antd components - updated version that works
jest.mock('antd', () => {
  const Select = ({ children, onChange, defaultValue }) => (
    <select
      data-testid="status-select"
      defaultValue={defaultValue}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
  return { Select };
});

// Mock useAuth with a simple function
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{ token: 'mock-token' }, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));  

jest.mock("../../hooks/useCategory", ()=> jest.fn(()=>[]));

Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
});

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
};

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

describe('AdminOrders Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset the useAuth mock to default
        const { useAuth } = require('../../context/auth');
        useAuth.mockReturnValue([{ token: 'mock-token' }, jest.fn()]);
        
        // Default mock data
        axios.get.mockResolvedValue({
            data: [
                {
                    _id: 'order1',
                    status: 'Processing',
                    buyer: { name: 'John Doe' },
                    createAt: '2023-01-01',
                    payment: { success: true },
                    products: [
                        {
                            _id: 'product1',
                            name: 'Test Product',
                            description: 'This is a test product description',
                            price: 100
                        }
                    ]
                }
            ]
        });
        
        axios.put.mockResolvedValue({
            data: { success: true }
        });
    });

    it("renders heading and AdminMenu", async () => {
        axios.get.mockResolvedValueOnce({ data: [] });

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    it("loads orders when token exists", async () => {
        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Success')).toBeInTheDocument();
        });
    });

    it("does not load orders when no token exists", async () => {
        const { useAuth } = require('../../context/auth');
        useAuth.mockReturnValue([{ token: null }, jest.fn()]);

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        expect(axios.get).not.toHaveBeenCalled();
    });

    it("handles status change successfully - covers handleChange success path", async () => {
        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const statusSelect = screen.getByTestId('status-select');
        
        await act(async () => {
            fireEvent.change(statusSelect, { target: { value: 'Shipped' } });
        });

        await waitFor(() => {
            // Covers: axios.put call in handleChange
            expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/order-status/order1', {
                status: 'Shipped'
            });
            // Covers: getOrders() call after successful status change
            expect(axios.get).toHaveBeenCalledTimes(2); // Initial + after update
        });
    });

    it("handles status change error - covers handleChange catch block", async () => {
        axios.put.mockRejectedValue(new Error('Network error'));

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const statusSelect = screen.getByTestId('status-select');
        
        await act(async () => {
            fireEvent.change(statusSelect, { target: { value: 'Delivered' } });
        });

        await waitFor(() => {
            // Covers: catch block in handleChange, console.log(error)
            expect(axios.put).toHaveBeenCalled();
            // getOrders() should not be called when there's an error
            expect(axios.get).toHaveBeenCalledTimes(1); // Only initial call
        });
    });

    it("handles getOrders error", async () => {
        axios.get.mockRejectedValue(new Error('Network error'));

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
        });
    });


    it("displays failed payment status", async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                {
                    _id: 'order2',
                    status: 'Not Processed',
                    buyer: { name: 'Jane Doe' },
                    createAt: '2023-01-01',
                    payment: { success: false },
                    products: []
                }
            ]
        });

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/all-orders');
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });
    });

    it("handles empty orders array", async () => {
        axios.get.mockResolvedValueOnce({
            data: []
        });

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        await waitFor(() => {
            expect(screen.getByText('All Orders')).toBeInTheDocument();
            expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        });
    });



    it("renders order card using index key when _id is missing", async () => {
        const mockOrders = [
            {
                status: 'Delivered',
                buyer: { name: 'Jane Doe' },
                createAt: '2023-01-02',
                payment: { success: true },
                products: []
            }
        ];

        axios.get.mockResolvedValueOnce({ data: mockOrders });

        await act(async () => {
            render(
                <MemoryRouter initialEntries={["/admin/orders"]}>
                    <Routes>
                        <Route path="/admin/orders" element={<AdminOrders />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        const orderDiv = screen.getByText('Jane Doe').closest('.border.shadow');
        expect(orderDiv).toBeInTheDocument();
        expect(orderDiv).toHaveClass('border');
        expect(orderDiv).toHaveClass('shadow');
    });

});
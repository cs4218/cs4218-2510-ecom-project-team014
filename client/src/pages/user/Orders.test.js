import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import Orders from './Orders';
import * as authContext from '../../context/auth';

// AI Disclaimer: The following test code was generated with the assistance of AI.

jest.mock('axios');
jest.mock('../../components/UserMenu', () => () => <div>UserMenuMock</div>);
jest.mock('../../components/Layout', () => (props) => <div {...props}>LayoutMock{props.children}</div>);
jest.mock('moment', () => () => ({ fromNow: () => 'a moment ago' }));

describe('Orders Page Pairwise', () => {
  const setAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(authContext, 'useAuth').mockReturnValue([{ token: 'mocktoken' }, setAuth]);
  });

  // 1. Orders: 0, Products: If we don't have any orders, we can't have products
  it('renders with 0 orders, 0 products', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('All Orders')).toBeInTheDocument();
    });
  });

  // 2. Orders: 1, Products: 0
  it('renders with 1 order, 0 products', async () => {
    const mockOrders = [{
      _id: 'order1',
      status: 'Processing',
      buyer: { name: 'John Doe' },
      createAt: '2024-06-01T00:00:00Z',
      payment: { success: true },
      products: []
    }];
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  // 3. Orders: 1, Products: 1
  it('renders with 1 order, 1 product', async () => {
    const mockOrders = [{
      _id: 'order1',
      status: 'Processing',
      buyer: { name: 'John Doe' },
      createAt: '2024-06-01T00:00:00Z',
      payment: { success: true },
      products: [{
        _id: 'prod1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100
      }]
    }];
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Price : 100')).toBeInTheDocument();
    });
  });

  // 4. Orders: 1, Products: Multiple
  it('renders with 1 order, multiple products', async () => {
    const mockOrders = [{
      _id: 'order1',
      status: 'Processing',
      buyer: { name: 'John Doe' },
      createAt: '2024-06-01T00:00:00Z',
      payment: { success: true },
      products: [
        { _id: 'prod1', name: 'Product 1', description: 'Description 1', price: 100 },
        { _id: 'prod2', name: 'Product 2', description: 'Description 2', price: 200 }
      ]
    }];
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
      expect(screen.getByText('Price : 100')).toBeInTheDocument();
      expect(screen.getByText('Price : 200')).toBeInTheDocument();
    });
  });

  // 5. Orders: Multiple, Products: 0
  it('renders with multiple orders, 0 products', async () => {
    const mockOrders = [
      {
        _id: 'order1',
        status: 'Shipped',
        buyer: { name: 'Alice' },
        createAt: '2024-06-02T00:00:00Z',
        payment: { success: false },
        products: []
      },
      {
        _id: 'order2',
        status: 'Delivered',
        buyer: { name: 'Bob' },
        createAt: '2024-06-03T00:00:00Z',
        payment: { success: true },
        products: []
      }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  // 6. Orders: Multiple, Products: 1
  it('renders with multiple orders, 1 product each', async () => {
    const mockOrders = [
      {
        _id: 'order1',
        status: 'Shipped',
        buyer: { name: 'Alice' },
        createAt: '2024-06-02T00:00:00Z',
        payment: { success: false },
        products: [
          { _id: 'prod1', name: 'Product A', description: 'Desc A', price: 50 }
        ]
      },
      {
        _id: 'order2',
        status: 'Delivered',
        buyer: { name: 'Bob' },
        createAt: '2024-06-03T00:00:00Z',
        payment: { success: true },
        products: [
          { _id: 'prod2', name: 'Product B', description: 'Desc B', price: 75 }
        ]
      }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('Desc A')).toBeInTheDocument();
      expect(screen.getByText('Desc B')).toBeInTheDocument();
      expect(screen.getByText('Price : 50')).toBeInTheDocument();
      expect(screen.getByText('Price : 75')).toBeInTheDocument();
    });
  });

  // 7. Orders: Multiple, Products: Multiple
  it('renders with multiple orders, multiple products', async () => {
    const mockOrders = [
      {
        _id: 'order1',
        status: 'Shipped',
        buyer: { name: 'Alice' },
        createAt: '2024-06-02T00:00:00Z',
        payment: { success: false },
        products: [
          { _id: 'prod1', name: 'Product A', description: 'Desc A', price: 50 },
          { _id: 'prod2', name: 'Product B', description: 'Desc B', price: 75 }
        ]
      },
      {
        _id: 'order2',
        status: 'Delivered',
        buyer: { name: 'Bob' },
        createAt: '2024-06-03T00:00:00Z',
        payment: { success: true },
        products: [
          { _id: 'prod3', name: 'Product C', description: 'Desc C', price: 200 }
        ]
      }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('Product C')).toBeInTheDocument();
      expect(screen.getByText('Desc A')).toBeInTheDocument();
      expect(screen.getByText('Desc B')).toBeInTheDocument();
      expect(screen.getByText('Desc C')).toBeInTheDocument();
      expect(screen.getByText('Price : 50')).toBeInTheDocument();
      expect(screen.getByText('Price : 75')).toBeInTheDocument();
      expect(screen.getByText('Price : 200')).toBeInTheDocument();
    });
  });

  // 8. API error
  it('handles axios error', async () => {
    axios.get.mockRejectedValueOnce({ message: 'Axios Error' });
    render(<MemoryRouter><Orders /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText('All Orders')).toBeInTheDocument();
    });
  });

  // 9. No token
  it('does not fetch orders if no token', async () => {
    jest.spyOn(authContext, 'useAuth').mockReturnValue([{}, setAuth]);
    render(<MemoryRouter><Orders /></MemoryRouter>);
    expect(axios.get).not.toHaveBeenCalled();
  });

  // 10. Undefined auth
  it('does not fetch orders if undefined auth', async () => {
    jest.spyOn(authContext, 'useAuth').mockReturnValue([undefined, setAuth]);
    render(<MemoryRouter><Orders /></MemoryRouter>);
    expect(axios.get).not.toHaveBeenCalled();
  });
});


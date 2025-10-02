import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import Orders from './Orders';
import * as authContext from '../../context/auth';

// Mock axios
jest.mock('axios');

// Mock UserMenu
jest.mock('../../components/UserMenu', () => () => <div>UserMenuMock</div>);

// Mock Layout
jest.mock('../../components/Layout', () => (props) => <div {...props}>LayoutMock{props.children}</div>);

// Mock moment
jest.mock('moment', () => () => ({
  fromNow: () => 'a moment ago'
}));

describe('Orders Page', () => {
  const setAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(authContext, 'useAuth').mockReturnValue([{ token: 'mocktoken' }, setAuth]);
  });

  it('should render orders and products correctly', async () => {
    console.log('Running Orders Page tests v3');
    const mockOrders = [
      {
        _id: 'order1',
        status: 'Processing',
        buyer: { name: 'John Doe' },
        createAt: '2024-06-01T00:00:00Z',
        payment: { success: true },
        products: [
          {
            _id: 'prod1',
            name: 'Product 1',
            description: 'Description 1',
            price: 100
          }
        ]
      }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    // Wait for orders to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('All Orders')).toBeInTheDocument();
      expect(screen.getByText('UserMenuMock')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('a moment ago')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Price : 100')).toBeInTheDocument();
    });
  });

  it('should render empty orders', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Orders')).toBeInTheDocument();
    });
  });

  it('should handle axios error', async () => {
    axios.get.mockRejectedValueOnce({ message: 'Axios Error' });

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('All Orders')).toBeInTheDocument();
    });
  });

  it('should not fetch orders if no token', async () => {
    jest.spyOn(authContext, 'useAuth').mockReturnValue([{}, setAuth]);
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should render multiple orders and products', async () => {
    const mockOrders = [
      {
        _id: 'order1',
        status: 'Shipped',
        buyer: { name: 'Alice' },
        createAt: '2024-06-02T00:00:00Z',
        payment: { success: false },
        products: [
          {
            _id: 'prod1',
            name: 'Product A',
            description: 'Desc A',
            price: 50
          },
          {
            _id: 'prod2',
            name: 'Product B',
            description: 'Desc B',
            price: 75
          }
        ]
      },
      {
        _id: 'order2',
        status: 'Delivered',
        buyer: { name: 'Bob' },
        createAt: '2024-06-03T00:00:00Z',
        payment: { success: true },
        products: [
          {
            _id: 'prod3',
            name: 'Product C',
            description: 'Desc C',
            price: 200
          }
        ]
      }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Desc A')).toBeInTheDocument();
      expect(screen.getByText('Price : 50')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('Desc B')).toBeInTheDocument();
      expect(screen.getByText('Price : 75')).toBeInTheDocument();
      expect(screen.getByText('Product C')).toBeInTheDocument();
      expect(screen.getByText('Desc C')).toBeInTheDocument();
      expect(screen.getByText('Price : 200')).toBeInTheDocument();
      expect(screen.getAllByText('Success').length).toBeGreaterThan(0);
    });
  });

  it('should handle undefined auth', async () => {
    jest.spyOn(authContext, 'useAuth').mockReturnValue([undefined, setAuth]);
    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
    expect(axios.get).not.toHaveBeenCalled();
  });
});


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
    // log a random message to make sure changes are being run
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
});


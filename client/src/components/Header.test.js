import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

// Mocks
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn(),
}));
jest.mock('../hooks/useCategory', () => jest.fn());
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
}));
jest.mock('./Form/SearchInput', () => () => <div>SearchInputMock</div>);
jest.mock('antd', () => ({
  Badge: ({ count, children }) => <span data-testid="badge">{count}{children}</span>,
}));

const { useAuth } = require('../context/auth');
const { useCart } = require('../context/cart');
const useCategory = require('../hooks/useCategory');
const toast = require('react-hot-toast');

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Equivalence Partitioning: No user, empty cart, no categories
  it('renders login/register links, empty cart, and no categories', () => {
    console.log('Running Orders Page tests v5');
    useAuth.mockReturnValue([{ user: null }, jest.fn()]);
    useCart.mockReturnValue([[]]);
    useCategory.mockReturnValue([]);

    const { getByText, queryByText, getByTestId } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Register')).toBeInTheDocument();
    expect(getByText('Login')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
    expect(getByText('All Categories')).toBeInTheDocument();
    expect(queryByText('Categories')).toBeInTheDocument();
  });

  // Equivalence Partitioning: No user, cart with 1 item, 1 category
  it('renders login/register links, cart with 1 item, and 1 category', () => {
    useAuth.mockReturnValue([{ user: null }, jest.fn()]);
    useCart.mockReturnValue([[{ id: 1 }]]);
    useCategory.mockReturnValue([{ name: 'Cat1', slug: 'cat1' }]);

    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Register')).toBeInTheDocument();
    expect(getByText('Login')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('1Cart');
    expect(getByText('Cat1')).toBeInTheDocument();
  });

  // Equivalence Partitioning: User logged in (role 0), cart empty, multiple categories
  it('renders user dropdown for role 0, empty cart, and multiple categories', () => {
    useAuth.mockReturnValue([{ user: { name: 'User', role: 0 } }, jest.fn()]);
    useCart.mockReturnValue([[]]);
    useCategory.mockReturnValue([
      { name: 'Cat1', slug: 'cat1' },
      { name: 'Cat2', slug: 'cat2' },
    ]);

    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('User')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
  });

  // Equivalence Partitioning: Admin logged in (role 1), cart with many items, multiple categories
  it('renders admin dropdown, cart with many items, and multiple categories', () => {
    useAuth.mockReturnValue([{ user: { name: 'Admin', role: 1 } }, jest.fn()]);
    useCart.mockReturnValue([[{}, {}, {}]]);
    useCategory.mockReturnValue([
      { name: 'Cat1', slug: 'cat1' },
      { name: 'Cat2', slug: 'cat2' },
    ]);

    const { getByText, getByTestId } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('3Cart');
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
  });

  // Boundary Value: Cart with 0 and 1 item, no categories
  it('renders cart with 0 and 1 item, no categories', () => {
    useAuth.mockReturnValue([{ user: { name: 'User', role: 0 } }, jest.fn()]);
    useCategory.mockReturnValue([]);
    useCart.mockReturnValue([[]]);
    const { getByTestId, rerender } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(getByTestId('badge')).toHaveTextContent('0Cart');

    useCart.mockReturnValue([[{ id: 1 }]]);
    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(getByTestId('badge')).toHaveTextContent('1Cart');
  });

  // Boundary Value: Categories array with 0, 1, and N items
  it('renders categories array with 0, 1, and N items', () => {
    useAuth.mockReturnValue([{ user: null }, jest.fn()]);
    useCart.mockReturnValue([[]]);
    useCategory.mockReturnValue([]);
    const { queryByText, rerender } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(queryByText('All Categories')).toBeInTheDocument();

    useCategory.mockReturnValue([{ name: 'Cat1', slug: 'cat1' }]);
    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(queryByText('Cat1')).toBeInTheDocument();

    useCategory.mockReturnValue([
      { name: 'Cat1', slug: 'cat1' },
      { name: 'Cat2', slug: 'cat2' },
      { name: 'Cat3', slug: 'cat3' },
    ]);
    rerender(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(queryByText('Cat1')).toBeInTheDocument();
    expect(queryByText('Cat2')).toBeInTheDocument();
    expect(queryByText('Cat3')).toBeInTheDocument();
  });

  // Test logout functionality
  it('calls handleLogout and shows toast on logout click', () => {
    const setAuth = jest.fn();
    useAuth.mockReturnValue([{ user: { name: 'User', role: 0 }, token: 'token' }, setAuth]);
    useCart.mockReturnValue([[]]);
    useCategory.mockReturnValue([]);

    const { getByText } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(getByText('Logout'));
    expect(setAuth).toHaveBeenCalledWith({
      user: null,
      token: '',
    });
    expect(toast.success).toHaveBeenCalledWith('Logout Successfully');
  });
});
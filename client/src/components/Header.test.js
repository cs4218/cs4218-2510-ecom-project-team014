import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import toast from "react-hot-toast";
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

// AI Disclaimer: The following test code was generated with the assistance of AI.

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

const categoryNone = [];
const categoryOne = [{ name: 'Cat1', slug: 'cat1', _id: '1' }];
const categoryMultiple = [
  { name: 'Cat1', slug: 'cat1', _id: '1' },
  { name: 'Cat2', slug: 'cat2', _id: '2' },
];

const cartEmpty = [];
const cartItems = [{ id: 1 }, { id: 2 }];

describe('Header exhaustive test cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to set mocks
  function setMocks(authUser, cart, categories) {
    useAuth.mockReturnValue([{ user: authUser }, jest.fn()]);
    useCart.mockReturnValue([cart]);
    useCategory.mockReturnValue(categories);
  }

  // 1. Null, Empty, None
  it('TC1: Null auth, empty cart, no categories', () => {
    console.log("Header tests v10");
    setMocks(null, cartEmpty, categoryNone);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Register')).toBeInTheDocument();
    expect(getByText('Login')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
    expect(getByText('All Categories')).toBeInTheDocument();
  });

  // 2. Null, Empty, One
  it('TC2: Null auth, empty cart, one category', () => {
    setMocks(null, cartEmpty, categoryOne);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
  });

  // 3. Null, Empty, Multiple
  it('TC3: Null auth, empty cart, multiple categories', () => {
    setMocks(null, cartEmpty, categoryMultiple);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
  });

  // 4. Null, Has items, None
  it('TC4: Null auth, cart items, no categories', () => {
    setMocks(null, cartItems, categoryNone);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Register')).toBeInTheDocument();
    expect(getByText('Login')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
    expect(getByText('All Categories')).toBeInTheDocument();
  });

  // 5. Null, Has items, One
  it('TC5: Null auth, cart items, one category', () => {
    setMocks(null, cartItems, categoryOne);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
  });

  // 6. Null, Has items, Multiple
  it('TC6: Null auth, cart items, multiple categories', () => {
    setMocks(null, cartItems, categoryMultiple);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
  });

  // 7. User, Empty, None
  it('TC7: User auth, empty cart, no categories', () => {
    setMocks({ name: 'User', role: 0 }, cartEmpty, categoryNone);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('User')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
    expect(getByText('All Categories')).toBeInTheDocument();
  });

  // 8. User, Empty, One
  it('TC8: User auth, empty cart, one category', () => {
    setMocks({ name: 'User', role: 0 }, cartEmpty, categoryOne);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('User')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
  });

  // 9. User, Empty, Multiple
  it('TC9: User auth, empty cart, multiple categories', () => {
    setMocks({ name: 'User', role: 0 }, cartEmpty, categoryMultiple);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
    expect(getByText('User')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
  });

  // 10. User, Has items, None
  it('TC10: User auth, cart items, no categories', () => {
    setMocks({ name: 'User', role: 0 }, cartItems, categoryNone);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('User')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
    expect(getByText('All Categories')).toBeInTheDocument();
  });

  // 11. User, Has items, One
  it('TC11: User auth, cart items, one category', () => {
    setMocks({ name: 'User', role: 0 }, cartItems, categoryOne);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('User')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
  });

  // 12. User, Has items, Multiple
  it('TC12: User auth, cart items, multiple categories', () => {
    setMocks({ name: 'User', role: 0 }, cartItems, categoryMultiple);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
    expect(getByText('User')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
  });

  // 13. Admin, Empty, None
  it('TC13: Admin auth, empty cart, no categories', () => {
    setMocks({ name: 'Admin', role: 1 }, cartEmpty, categoryNone);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
    expect(getByText('All Categories')).toBeInTheDocument();
  });

  // 14. Admin, Empty, One
  it('TC14: Admin auth, empty cart, one category', () => {
    setMocks({ name: 'Admin', role: 1 }, cartEmpty, categoryOne);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
  });

  // 15. Admin, Empty, Multiple
  it('TC15: Admin auth, empty cart, multiple categories', () => {
    setMocks({ name: 'Admin', role: 1 }, cartEmpty, categoryMultiple);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('0Cart');
  });

  // 16. Admin, Has items, None
  it('TC16: Admin auth, cart items, no categories', () => {
    setMocks({ name: 'Admin', role: 1 }, cartItems, categoryNone);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
    expect(getByText('Logout')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
    expect(getByText('All Categories')).toBeInTheDocument();
  });

  // 17. Admin, Has items, One
  it('TC17: Admin auth, cart items, one category', () => {
    setMocks({ name: 'Admin', role: 1 }, cartItems, categoryOne);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
  });

  // 18. Admin, Has items, Multiple
  it('TC18: Admin auth, cart items, multiple categories', () => {
    setMocks({ name: 'Admin', role: 1 }, cartItems, categoryMultiple);
    const { getByText, getByTestId } = render(<MemoryRouter><Header /></MemoryRouter>);
    expect(getByText('Cat1')).toBeInTheDocument();
    expect(getByText('Cat2')).toBeInTheDocument();
    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByTestId('badge')).toHaveTextContent('2Cart');
  });

  // 19. Test logout functionality
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
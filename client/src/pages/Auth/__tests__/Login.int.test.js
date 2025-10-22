import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import Login from '../Login';

import { AuthProvider } from '../../../context/auth';
import { CartProvider } from '../../../context/cart';
import { SearchProvider } from '../../../context/search';

// Mock axios and react-hot-toast
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock useNavigate to track navigation
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...originalModule,
    useNavigate: () => mockedUsedNavigate,
  };
});

// Optional: Provide a stub CategoryProvider and context if needed as done previously
const CategoryContext = React.createContext([]);
const CategoryProvider = ({ children }) => (
  <CategoryContext.Provider value={[]}>{children}</CategoryContext.Provider>
);

// Helper to wrap component with required providers and setup localStorage
const renderWithProviders = (ui) => {
  // Setup localStorage auth and cart data required for providers
  localStorage.setItem('auth', JSON.stringify({ user: { name: 'Test User' }, token: 'testtoken' }));
  localStorage.setItem('cart', JSON.stringify([]));
  localStorage.setItem('search', JSON.stringify({ keyword: '', results: [] }));

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <CategoryProvider>
              {ui}
            </CategoryProvider>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Login Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form with all inputs', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );

    expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
  });

  it('allows typing email and password', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
    expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('password123');
  });

  it('logs in user successfully updates auth and navigates', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
        message: 'Login successful',
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(toast.success).toHaveBeenCalledWith('Login successful', expect.any(Object));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
    // Check localStorage updated with auth data
    const storedAuth = JSON.parse(localStorage.getItem('auth'));
    expect(storedAuth.token).toBe('mockToken');
    expect(storedAuth.user.email).toBe('test@example.com');
  });

  it('handles login failure with toast error', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: 'Invalid credentials' } });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    expect(mockedUsedNavigate).not.toHaveBeenCalled();
  });

  it('handles network error during login with toast error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(mockedUsedNavigate).not.toHaveBeenCalled();
  });

  it('navigates to forgot password page when button clicked', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );

    fireEvent.click(screen.getByText('Forgot Password'));

    expect(mockedUsedNavigate).toHaveBeenCalledWith('/forgot-password');
  });
});

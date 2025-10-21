import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import Register from '../Register';

import { AuthProvider } from '../../../context/auth';
import { CartProvider } from '../../../context/cart';
import { SearchProvider } from '../../../context/search';

// Mock axios and react-hot-toast
jest.mock('axios');
jest.mock('react-hot-toast');

// Mock useNavigate to test navigation
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...originalModule,
    useNavigate: () => mockedUsedNavigate,
  };
});

// Optional: if you have no real CategoryProvider, stub it here
const CategoryContext = React.createContext([]);

const CategoryProvider = ({ children }) => (
  <CategoryContext.Provider value={[]}>
    {children}
  </CategoryContext.Provider>
);

// Helper to setup localStorage and render with all providers
const renderWithProviders = (ui) => {
  localStorage.setItem(
    'auth',
    JSON.stringify({ user: { name: 'Test User' }, token: 'testtoken' })
  );
  localStorage.setItem('cart', JSON.stringify([]));
  localStorage.setItem('search', JSON.stringify({ keyword: '', results: [] }));

  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <CategoryProvider>{ui}</CategoryProvider>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Register Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('registers user successfully and navigates to login with success toast', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderWithProviders(
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'securepass' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '456 Avenue' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '1990-12-31' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Basketball' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'securepass',
        phone: '9876543210',
        address: '456 Avenue',
        DOB: '1990-12-31',
        answer: 'Basketball',
      });
      expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('displays error toast when registration API returns success false', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: 'User already registered' } });

    renderWithProviders(
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'securepass' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '456 Avenue' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '1990-12-31' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Basketball' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('User already registered');
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });

  it('displays error toast when axios call fails', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'securepass' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '456 Avenue' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '1990-12-31' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Basketball' } });

    fireEvent.click(screen.getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });
});

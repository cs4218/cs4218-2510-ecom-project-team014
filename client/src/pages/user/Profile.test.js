import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Profile from './Profile';

// AI Disclaimer: The following test code was generated with the assistance of AI.

// Mocks
jest.mock('../../components/UserMenu', () => () => <div>UserMenuMock</div>);
jest.mock('./../../components/Layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));
jest.mock('axios');

const { useAuth } = require('../../context/auth');
const toast = require('react-hot-toast');
const axios = require('axios');

describe('Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for useAuth
    useAuth.mockReturnValue([
      { user: { name: 'John', email: 'john@example.com', phone: '1234567890', address: '123 Main St' } },
      jest.fn(),
    ]);
    // Mock localStorage
    global.localStorage.setItem('auth', JSON.stringify({ user: { name: 'John', email: 'john@example.com', phone: '1234567890', address: '123 Main St' } }));
  });

  // 1. Renders with missing user fields
  it('renders with missing user fields', () => {
    useAuth.mockReturnValue([{ user: {} }, jest.fn()]);
    const { getByPlaceholderText } = render(<Profile />);
    expect(getByPlaceholderText('Enter Your Name').value).toBe('');
    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('');
    expect(getByPlaceholderText('Enter Your Address').value).toBe('');
  });

  // 2. Renders with no user (auth.user is undefined)
  it('renders with no user', () => {
    useAuth.mockReturnValue([{ user: undefined }, jest.fn()]);
    const { getByPlaceholderText } = render(<Profile />);
    expect(getByPlaceholderText('Enter Your Name').value).toBe('');
    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('');
    expect(getByPlaceholderText('Enter Your Address').value).toBe('');
  });

  // 3. Renders with pre-filled user data
  it('renders with user data populated', () => {
    const { getByPlaceholderText } = render(<Profile />);
    expect(getByPlaceholderText('Enter Your Name').value).toBe('John');
    expect(getByPlaceholderText('Enter Your Email').value).toBe('john@example.com');
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('1234567890');
    expect(getByPlaceholderText('Enter Your Address').value).toBe('123 Main St');
  });

  // 4. Handles input changes
  it('updates state on input change', () => {
    const { getByPlaceholderText } = render(<Profile />);
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane' } });
    expect(getByPlaceholderText('Enter Your Name').value).toBe('Jane');
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
    expect(getByPlaceholderText('Enter Your Phone').value).toBe('9876543210');
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '456 Elm St' } });
    expect(getByPlaceholderText('Enter Your Address').value).toBe('456 Elm St');
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'newpass' } });
    expect(getByPlaceholderText('Enter Your Password').value).toBe('newpass');
  });

  // 5. Email input is disabled
  it('email input is disabled', () => {
    const { getByPlaceholderText } = render(<Profile />);
    expect(getByPlaceholderText('Enter Your Email')).toBeDisabled();
  });

  // 6. Submits form and handles success response
  it('submits form and handles success', async () => {
    const setAuth = jest.fn();
    useAuth.mockReturnValue([
      { user: { name: 'John', email: 'john@example.com', phone: '1234567890', address: '123 Main St' } },
      setAuth,
    ]);
    axios.put.mockResolvedValue({
      data: {
        updatedUser: { name: 'Jane', email: 'john@example.com', phone: '9876543210', address: '456 Elm St' },
      },
    });

    const { getByText, getByPlaceholderText } = render(<Profile />);
    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '9876543210' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '456 Elm St' } });
    fireEvent.click(getByText('UPDATE'));

    await waitFor(() => {
      expect(setAuth).toHaveBeenCalledWith({
        user: { name: 'Jane', email: 'john@example.com', phone: '9876543210', address: '456 Elm St' },
        // ...other auth fields if present
      });
      expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
      // Check localStorage updated
      const ls = JSON.parse(global.localStorage.getItem('auth'));
      expect(ls.user.name).toBe('Jane');
      expect(ls.user.phone).toBe('9876543210');
      expect(ls.user.address).toBe('456 Elm St');
    });
  });

  // 7. Submits form and handles error response from API
  it('handles error response from API', async () => {
    axios.put.mockResolvedValue({
      data: { error: true, error: 'API Error' },
    });
    const { getByText } = render(<Profile />);
    fireEvent.click(getByText('UPDATE'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('API Error');
    });
  });

  // 8. Submits form and handles exception thrown
  it('handles exception thrown by API', async () => {
    axios.put.mockRejectedValue(new Error('Network Error'));
    const { getByText } = render(<Profile />);
    fireEvent.click(getByText('UPDATE'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  // 9. Email input is enabled when custom emailDisabled prop is set to false
  it('should allow typing in email field when not disabled', () => {
    console.log("Running new test");
    const { getByPlaceholderText } = render(<Profile emailDisabled={false} />);
    const emailInput = getByPlaceholderText('Enter Your Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });
});
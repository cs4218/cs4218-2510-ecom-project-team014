import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import PrivateRoute from './Private'; 
import { useAuth } from '../../context/auth'; 
import Spinner from '../Spinner'; 

// Mock dependencies
jest.mock('axios');
jest.mock('../../context/auth');
jest.mock('../Spinner', () => {
  return function MockSpinner({ path }) {
    return <div data-testid="spinner">Loading...</div>;
  };
});

// Mock Outlet component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Protected Content</div>
}));

const mockAxios = axios;
const mockUseAuth = useAuth;

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Outlet when auth token exists and API returns ok=true', async () => {
    // Mock auth context with token
    mockUseAuth.mockReturnValue([
      { token: 'valid-token' },
      jest.fn()
    ]);

    // Mock successful API response
    mockAxios.get.mockResolvedValue({
      data: { ok: true }
    });

    render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );

    // Initially shows spinner
    expect(screen.getByTestId('spinner')).toBeInTheDocument();

    // After API call, shows outlet
    await waitFor(() => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
  });

  test('renders Spinner when auth token exists but API returns ok=false', async () => {
    // Mock auth context with token
    mockUseAuth.mockReturnValue([
      { token: 'valid-token' },
      jest.fn()
    ]);

    // Mock failed API response
    mockAxios.get.mockResolvedValue({
      data: { ok: false }
    });

    render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );

    // Shows spinner after API call
    await waitFor(() => {
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
  });

  test('renders Spinner when no auth token exists', () => {
    // Mock auth context without token
    mockUseAuth.mockReturnValue([
      { token: null },
      jest.fn()
    ]);

    render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );

    // Shows spinner immediately, no API call made
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    expect(mockAxios.get).not.toHaveBeenCalled();
  });

  test('renders Spinner when auth is undefined', () => {
    // Mock auth context with undefined auth
    mockUseAuth.mockReturnValue([
      undefined,
      jest.fn()
    ]);

    render(
      <BrowserRouter>
        <PrivateRoute />
      </BrowserRouter>
    );

    // Shows spinner immediately, no API call made
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    expect(mockAxios.get).not.toHaveBeenCalled();
  });
});
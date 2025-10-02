import React from 'react';
import { render, act } from '@testing-library/react';
import Spinner from './Spinner';

// Mock useNavigate and useLocation from react-router-dom
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/current' };

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe('Spinner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with initial count and spinner', () => {
    const { getByText, getByRole } = render(<Spinner />);
    expect(getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    expect(getByRole('status')).toBeInTheDocument();
    expect(getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('counts down and navigates after reaching zero (default path)', () => {
    render(<Spinner />);
    // Initial count
    expect(mockNavigate).not.toHaveBeenCalled();
    // Fast-forward 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    // Should navigate to /login
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: '/current' });
  });

  it('counts down and navigates after reaching zero (custom path)', () => {
    render(<Spinner path="dashboard" />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { state: '/current' });
  });

  it('updates the displayed count each second', () => {
    const { getByText } = render(<Spinner />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText(/redirecting to you in 2 second/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText(/redirecting to you in 1 second/i)).toBeInTheDocument();
  });

  it('clears interval on unmount', () => {
    const clearSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = render(<Spinner />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
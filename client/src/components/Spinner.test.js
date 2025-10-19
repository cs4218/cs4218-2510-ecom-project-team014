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
  // 1. Renders with initital count of 3 and shows spinner
  it('renders with initial count and spinner', () => {
    const { getByText, getByRole } = render(<Spinner />);
    expect(getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    expect(getByRole('status')).toBeInTheDocument();
    expect(getByText(/Loading.../i)).toBeInTheDocument();
  });
  // 2. Counts down and navigates to default path (/login) after reaching zero
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
  // 3. Counts down and navigates to custom path after reaching zero
  it('counts down and navigates after reaching zero (custom path)', () => {
    render(<Spinner path="dashboard" />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { state: '/current' });
  });

  // 4. Ensures the count updates correctly each second with default path
  it('updates the displayed count each second - default path', () => {
    const { getByText } = render(<Spinner />);
    expect(getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText(/redirecting to you in 2 second/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText(/redirecting to you in 1 second/i)).toBeInTheDocument();
  });

  // 5. Ensures the count updates correctly each second with custom path
  it('updates the displayed count each second - custom path', () => {
    const { getByText } = render(<Spinner path="dashboard"/>);
    expect(getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText(/redirecting to you in 2 second/i)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(getByText(/redirecting to you in 1 second/i)).toBeInTheDocument();
  });

  // 6. Ensures interval is cleared on unmount
  it('clears interval on unmount', () => {
    const clearSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = render(<Spinner />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
/**
 * Spinner.integration.test.js
 * - Verifies Spinner appears inside PrivateRoute while auth check runs
 * - Verifies Spinner triggers navigation after countdown (useFakeTimers)
 */

// Mocks must be declared before requiring modules under test
jest.mock('axios');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/current' }),
  };
});
jest.mock('../context/auth', () => ({
  useAuth: jest.fn(),
}));

const React = require('react');
const { render, screen, act, waitFor } = require('@testing-library/react');
const { BrowserRouter } = require('react-router-dom');

const axios = require('axios');
const authHook = require('../context/auth');
const PrivateRoute = require('../components/Routes/Private').default;
const Spinner = require('../components/Spinner').default;

describe('Spinner integrated in route guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Ensure timers restored if a test used fake timers
    try {
      jest.useRealTimers();
    } catch (e) {}
  });

  it('shows Spinner countdown text while auth-check is pending', async () => {
    // auth has token so PrivateRoute will run auth check
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'token' }, jest.fn()]);
    // Make axios.get never resolve so auth-check remains pending and Spinner stays mounted
    axios.get.mockReturnValue(new Promise(() => {}));

    render(
      React.createElement(BrowserRouter, null,
        React.createElement(PrivateRoute, null)
      )
    );

    // Spinner renders initial count and spinner role
    expect(await screen.findByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('navigates after countdown completes (uses fake timers)', async () => {
    jest.useFakeTimers();
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'token' }, jest.fn()]);
    axios.get.mockReturnValue(new Promise(() => {})); // keep Spinner mounted

    render(
      React.createElement(BrowserRouter, null,
        React.createElement(PrivateRoute, null)
      )
    );

    // Spinner initial text present
    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();

    // advance timers to trigger countdown -> navigate
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Spinner uses default path "login" and passes current location as state
    expect(mockNavigate).toHaveBeenCalledWith('/', { state: '/current' });

    jest.useRealTimers();
  });

  it('renders Spinner standalone and triggers navigation after countdown (covers top-level lines)', () => {
    // ensure timers isolate
    jest.useFakeTimers();

    // Render Spinner directly to exercise module-level code (useState/useEffect)
    render(React.createElement(Spinner, null));

    // initial UI
    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();

    act(() => {
    jest.advanceTimersByTime(3000);
    });

    expect(mockNavigate).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
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

describe('Spinner integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    //ensure timers restored if a test used fake timers
    try {
      jest.useRealTimers();
    } catch (e) {}
  });

  it('shows Spinner countdown text while auth-check is pending', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'token' }, jest.fn()]);
    //axios.get doesn't resolve, so the check is pending and we can Spinner remains mounted
    axios.get.mockReturnValue(new Promise(() => {}));

    render(
      React.createElement(BrowserRouter, null,
        React.createElement(PrivateRoute, null)
      )
    );

    expect(await screen.findByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('navigates after countdown completes w/ fake timers', async () => {
    jest.useFakeTimers();
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'token' }, jest.fn()]);
    axios.get.mockReturnValue(new Promise(() => {})); //keep spinner mounted

    render(
      React.createElement(BrowserRouter, null,
        React.createElement(PrivateRoute, null)
      )
    );

    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();

    //advance to navigate
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    //default navigate path
    expect(mockNavigate).toHaveBeenCalledWith('/', { state: '/current' });

    jest.useRealTimers();
  });

  it('renders Spinner itself and triggers navigation after countdown', () => {
    jest.useFakeTimers();

    render(React.createElement(Spinner, null));

    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockNavigate).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
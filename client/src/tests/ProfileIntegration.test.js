jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => require('react').createElement(require('react').Fragment, null, children),
}));

// Mock Layout to a simple wrapper component
jest.mock('../components/Layout', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }) => React.createElement('div', { 'data-testid': 'layout' }, children),
  };
});

// Mock the UserMenu used inside Profile so it returns a valid React node
jest.mock('../components/UserMenu', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'user-menu' }, 'UserMenuMock'),
  };
});

// other mocks (toast/axios/auth) should remain before requires
// create toast spy functions so tests can assert calls
const mockSuccess = jest.fn();
const mockError = jest.fn();
jest.mock('react-hot-toast', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      success: (...args) => mockSuccess(...args),
      error: (...args) => mockError(...args),
    },
    Toaster: () => React.createElement('div', { 'data-testid': 'mock-toaster' }),
  };
});
jest.mock('axios');
jest.mock('../context/auth', () => ({ useAuth: jest.fn(() => [{ user: null, token: null }, jest.fn()]) }));

// Testing helpers and requires after mocks
const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

const Profile = require('../pages/user/Profile').default;
const Layout = require('../components/Layout').default;
const authHook = require('../context/auth');
const axios = require('axios');

describe('Profile integration tests', () => {
  let user;
  let token;
  let setAuth;

  beforeEach(() => {
    jest.clearAllMocks();

    user = { name: 'daniel', email: 'daniel@gmail.com', phone: '99991111', address: '12 Kent Ridge' };
    token = 'tok';
    setAuth = jest.fn();
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ user, token }, setAuth]);

    //stub localStorage
    Storage.prototype.getItem = jest.fn((k) => (k === 'auth' ? JSON.stringify({ user, token }) : null));
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('submits, updates auth + shows success toast (includes password/phone/address)', async () => {
    const updatedUser = { ...user, name: 'DZhang', phone: '111222', address: 'New Addr' };
    axios.put.mockResolvedValueOnce({ data: { updatedUser } });

    render(
      React.createElement(MemoryRouter, null, React.createElement(Layout, null, React.createElement(Profile, { emailDisabled: false })))
    );

    // initial values from auth context
    const nameInput = screen.getByPlaceholderText('Enter Your Name');
    const emailInput = screen.getByPlaceholderText('Enter Your Email');
    const passwordInput = screen.getByPlaceholderText('Enter Your Password');
    const phoneInput = screen.getByPlaceholderText('Enter Your Phone');
    const addressInput = screen.getByPlaceholderText('Enter Your Address');

    expect(nameInput.value).toBe(user.name);
    expect(emailInput.value).toBe(user.email);

    // update fields including password/phone/address
    fireEvent.change(nameInput, { target: { value: 'DZhang' } });
    fireEvent.change(emailInput, { target: { value: 'dzhang@gmail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpass' } });
    fireEvent.change(phoneInput, { target: { value: '111222' } });
    fireEvent.change(addressInput, { target: { value: 'New Addr' } });

    const btn = screen.getByText('UPDATE');
    fireEvent.click(btn);

    await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

    // verify axios payload contains the fields we set
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        '/api/v1/auth/profile',
        expect.objectContaining({
          name: 'DZhang',
          email: 'dzhang@gmail.com',
          password: 'newpass',
          phone: '111222',
          address: 'New Addr',
        })
      )
    );

    // toast and auth updates
    await waitFor(() => expect(mockSuccess).toHaveBeenCalledWith('Profile Updated Successfully'));
    expect(setAuth).toHaveBeenCalled();
    const calledWith = setAuth.mock.calls[0][0];
    expect(calledWith.user).toEqual(updatedUser);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('initializes inputs to empty when auth.user is missing', async () => {
    // simulate no user in auth
    const setAuthMock = jest.fn();
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ user: null, token: null }, setAuthMock]);

    render(
    React.createElement(MemoryRouter, null, React.createElement(Layout, null, React.createElement(Profile, { emailDisabled: false })))
    );
    // inputs should be empty strings as per default destructure in useEffect
    expect(screen.getByPlaceholderText('Enter Your Name').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Phone').value).toBe('');
    expect(screen.getByPlaceholderText('Enter Your Address').value).toBe('');
    
  });

  it('handles axios rejection and shows generic error toast', async () => {
    axios.put.mockRejectedValueOnce(new Error('Network'));

    render(
      React.createElement(MemoryRouter, null, React.createElement(Layout, null, React.createElement(Profile, { emailDisabled: false })))
    );

    // submit without changes
    const btn = screen.getByText('UPDATE');
    fireEvent.click(btn);

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    await waitFor(() => expect(mockError).toHaveBeenCalledWith('Something went wrong'));
  });

  it('shows error toast when API responds with data.error', async () => {
    axios.put.mockResolvedValueOnce({ data: { error: 'API Error' } });

    render(
      React.createElement(MemoryRouter, null, React.createElement(Layout, null, React.createElement(Profile, { emailDisabled: false })))
    );

    const btn = screen.getByText('UPDATE');
    fireEvent.click(btn);

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    await waitFor(() => expect(mockError).toHaveBeenCalledWith('API Error'));
  });

  it('renders with emailDisabled=true, input disabled', async () => {
    render(
      React.createElement(MemoryRouter, null, React.createElement(Layout, null, React.createElement(Profile, { emailDisabled: true })))
    );

    const emailInput = screen.getByPlaceholderText('Enter Your Email');
    expect(emailInput).toBeDisabled();
  });
});

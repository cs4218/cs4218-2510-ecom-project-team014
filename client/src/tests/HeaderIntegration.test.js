jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => require('react').createElement('div', { 'data-testid': 'mock-toaster' }),
}));

jest.mock('react-helmet', () => {
  const React = require('react');
  return {
    Helmet: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../context/auth', () => ({ useAuth: jest.fn(() => [{ user: null, token: null }, jest.fn()]) }));
jest.mock('../context/cart', () => ({ useCart: jest.fn(() => [[], jest.fn()]) }));
jest.mock('../hooks/useCategory', () => jest.fn(() => []));
jest.mock('../context/search', () => ({ useSearch: jest.fn(() => [{ query: '' }, jest.fn()]) }));

const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

const Header = require('../components/Header').default;
const Layout = require('../components/Layout').default;
const authHook = require('../context/auth');
const cartHook = require('../context/cart');
const useCategory = require('../hooks/useCategory');

describe('Header integration (Layout + Header)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authHook.useAuth.mockReturnValue([{ user: null, token: null }, jest.fn()]);
    cartHook.useCart.mockReturnValue([[], jest.fn()]);
    useCategory.mockReturnValue([]);
  });

  it('renders links for guests only', () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null, React.createElement('div', null, 'ChildPage'))
      )
    );

    // Use role queries to avoid ambiguous text matches
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();

    const cartLink = screen.getByRole('link', { name: 'Cart' });
    expect(cartLink).toBeTruthy();
    expect(cartLink).toHaveAttribute('href', '/cart');
  });

  it('shows categories dropdowns and respective category options', async () => {
    //fake categories
    useCategory.mockReturnValue([{ name: 'CatA', slug: 'cata' }, { name: 'CatB', slug: 'catb' }]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Header, null)
      )
    );

    const categories = screen.getByText('Categories');
    expect(categories).toBeInTheDocument();
    fireEvent.click(categories);
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('CatA')).toBeInTheDocument();
    expect(screen.getByText('CatB')).toBeInTheDocument();
  });

  it('check cart item count when cart has items', () => {
    //fake cart items
    cartHook.useCart.mockReturnValue([[{ id: 1 }, { id: 2 }], jest.fn()]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Header, null)
      )
    );
    //check num cart items
    const badge = screen.getByText(/2/);
    expect(badge).toBeInTheDocument();
  });

  it('check user menu and dashboard are showing when logged in', () => {
    authHook.useAuth.mockReturnValue([{ user: { name: 'User', role: 0 }, token: 'tok' }, jest.fn()]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Header, null)
      )
    );
    expect(screen.getByText('User')).toBeInTheDocument();
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toBeTruthy();

    const href = dashboardLink.getAttribute('href') || '';
    expect(href.toLowerCase()).toContain('dashboard');
  });

  it('admin user should show admin dashboard', () => {
    authHook.useAuth.mockReturnValue([{ user: { name: 'Admin', role: 1 }, token: 'tok' }, jest.fn()]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Header, null)
      )
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toBeTruthy();
    const href = dashboardLink.getAttribute('href') || '';
    expect(href.toLowerCase()).toContain('dashboard');
  });

  it('renders the search input in header', () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Header, null)
      )
    );

    const search = screen.getByPlaceholderText('Search');
    expect(search).toBeInTheDocument();
  });

  it('logging out calls setAuth, clears localStorage, and shows toast', () => {
    //simulate logging in first
    const mockSetAuth = jest.fn();
    authHook.useAuth.mockReturnValue([{ user: { name: 'User', role: 0 }, token: 'tok' }, mockSetAuth]);
    
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null, React.createElement('div', null, 'ChildPage'))
      )
    );

    //make sure logged in correctly
    const userToggle = screen.getByText('User');
    expect(userToggle).toBeInTheDocument();
    fireEvent.click(userToggle);

    //make sure auth token removed correctly (logged out)
    const removeSpy = jest.spyOn(window.localStorage.__proto__, 'removeItem');

    const logout = screen.getByText('Logout');
    expect(logout).toBeInTheDocument();
    fireEvent.click(logout);

    expect(removeSpy).toHaveBeenCalledWith('auth');
    const toastModule = require('react-hot-toast');
    expect(toastModule.default.success).toHaveBeenCalledWith('Logout Successfully');

    removeSpy.mockRestore();
  });
});



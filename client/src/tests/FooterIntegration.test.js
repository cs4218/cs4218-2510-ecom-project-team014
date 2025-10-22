jest.mock('react-hot-toast', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() },
    Toaster: () => React.createElement('div', { 'data-testid': 'mock-toaster' }),
  };
});

jest.mock('react-helmet', () => {
  const React = require('react');
  return {
    Helmet: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../context/auth', () => ({ useAuth: jest.fn(() => [{ user: null, token: null }, jest.fn()]) }));
jest.mock('../context/cart', () => ({ useCart: jest.fn(() => [[], jest.fn()]) }));
jest.mock('../context/search', () => ({ useSearch: jest.fn(() => [{ keyword: '', results: [] }, jest.fn()]) }));
jest.mock('../hooks/useCategory', () => jest.fn(() => []));

const React = require('react');
const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { MemoryRouter, Routes, Route } = require('react-router-dom');

const Layout = require('../components/Layout').default;
const Footer = require('../components/Footer').default;
const authHook = require('../context/auth');

describe('Footer integration (Layout + Footer)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.title = '';
  });

  it('renders footer text and links inside Layout', async () => {
    // default auth mock already returns no user
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
          React.createElement('div', null, 'ChildPage')
        )
      )
    );

    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();

    // links exist and have correct hrefs
    const aboutLink = screen.getByText('About').closest('a');
    const contactLink = screen.getByText('Contact').closest('a');
    const policyLink = screen.getByText('Privacy Policy').closest('a');

    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(contactLink).toHaveAttribute('href', '/contact');
    expect(policyLink).toHaveAttribute('href', '/policy');
  });

  it('check routes for Footer links', async () => {
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/', element: React.createElement(Layout, null, React.createElement('div', null, 'HomeChild')) }),
          React.createElement(Route, { path: '/about', element: React.createElement(Layout, null, React.createElement('div', null, 'AboutPage')) }),
          React.createElement(Route, { path: '/contact', element: React.createElement(Layout, null, React.createElement('div', null, 'ContactPage')) }),
          React.createElement(Route, { path: '/policy', element: React.createElement(Layout, null, React.createElement('div', null, 'PolicyPage')) })
        )
      )
    );

    fireEvent.click(screen.getByText('About'));
    await waitFor(() => expect(screen.getByText('AboutPage')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Contact'));
    await waitFor(() => expect(screen.getByText('ContactPage')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Privacy Policy'));
    await waitFor(() => expect(screen.getByText('PolicyPage')).toBeInTheDocument());
  });

  it('check footer with logged in user', () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ user: { name: 'Test' }, token: 'tok' }, jest.fn()]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null, React.createElement('div', null, 'ChildPage'))
      )
    );

    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
  });
});
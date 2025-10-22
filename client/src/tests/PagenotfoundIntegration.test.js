jest.mock('react-hot-toast', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      success: jest.fn(),
      error: jest.fn(),
    },
    Toaster: () => React.createElement('div', { 'data-testid': 'mock-toaster' }),
  };
});

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [{ user: null, token: null }, jest.fn()]),
}));
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));
jest.mock('../hooks/useCategory', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));
jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ query: '' }, jest.fn()]),
}));

const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

const Layout = require('../components/Layout').default;
const Pagenotfound = require('../pages/Pagenotfound').default;
const authHook = require('../context/auth');

describe('Pagenotfound integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.head.innerHTML = '';
    document.title = '';
    if (!window.matchMedia) {
      window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
    }
  });

  it('renders 404 page inside Layout and sets document title and link', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ user: null, token: null }, jest.fn()]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
          React.createElement(Pagenotfound, null)
        )
      )
    );
    
    //check title+heading
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/Oops ! Page Not Found/i)).toBeInTheDocument();

    //check go back link
    const goBack = screen.getByText('Go Back');
    expect(goBack).toBeInTheDocument();
    expect(goBack.closest('a')).toHaveAttribute('href', '/');

    //ensure title set correctly
    await waitFor(() => {
      const titleEl = document.querySelector('title');
      const titleText = titleEl && String(titleEl.textContent).trim().length > 0
          ? titleEl.textContent.trim()
          : document.title;
      expect(titleText).toBe('go back- page not found');
    });

    //header and footer present
    expect(
      document.querySelector('header') ||
      document.querySelector('[data-testid="header"]') ||
      document.querySelector('nav')
    ).toBeTruthy();

    expect(
      document.querySelector('footer') ||
      document.querySelector('[data-testid="footer"]') ||
      document.querySelector('.footer')
    ).toBeTruthy();
  });
});
/**
 * Full integration tests for Orders page inside the real Layout (Header/Footer).
 * Covers: 0 orders, 1 order + 1 product, API error, no token, undefined auth.
 */

// keep mocks before requiring modules under test
jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => require('react').createElement(require('react').Fragment, null, children),
}));

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

jest.mock('axios');
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));
jest.mock('../hooks/useCategory', () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));
jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '', results: [] }, jest.fn()]),
}));

const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

const axios = require('axios');
const authHook = require('../context/auth'); // -> useAuth
const Layout = require('../components/Layout').default;
const Orders = require('../pages/user/Orders').default;

describe('Orders full integration (Layout + Orders)', () => {
  const setAuth = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // ensure clean DOM for Helmet/meta changes from Layout
    document.head.innerHTML = '';
    document.title = '';
  });

  it('0 orders -> shows "All Orders" and no order cards', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'mock-token', user: { name: 'Test' } }, setAuth]);
    axios.get.mockResolvedValueOnce({ data: [] });

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
          React.createElement(Orders, null)
        )
      )
    );

    await waitFor(() => expect(screen.getByText('All Orders')).toBeInTheDocument());
    // no order card containers rendered
    const orderDivs = document.querySelectorAll('.border.shadow');
    expect(orderDivs.length).toBe(0);
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
  });

  it('1 order + 1 product -> renders order status, buyer, product info', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'mock-token', user: { name: 'Test' } }, setAuth]);

    const mockOrders = [
      {
        _id: 'order1',
        status: 'Processing',
        buyer: { name: 'John Doe' },
        createAt: new Date().toISOString(),
        payment: { success: true },
        products: [
          { _id: 'p1', name: 'Product 1', description: 'A nice product', price: 100 }
        ]
      }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrders });

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
          React.createElement(Orders, null)
        )
      )
    );

    await waitFor(() => expect(screen.getByText('Processing')).toBeInTheDocument());
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText(/A nice product/)).toBeInTheDocument();
    expect(screen.getByText('Price : 100')).toBeInTheDocument();
  });

  // ...existing code...
  it('1 order with failed payment and product without _id -> renders "Failed" and product info (covers uncovered branches)', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'mock-token', user: { name: 'Test' } }, setAuth]);

    const mockOrdersFailed = [
        {
        _id: 'order-failed',
        status: 'Cancelled',
        buyer: { name: 'Alice' },
        createAt: new Date().toISOString(),
        payment: { success: false }, // exercise the "Failed" branch
        products: [
            // product without _id to exercise the fallback key branch
            { name: 'NoId Product', description: 'No id desc', price: 42 }
        ]
        }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrdersFailed });

    render(
        React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
            React.createElement(Orders, null)
        )
        )
    );

    await waitFor(() => expect(screen.getByText('Failed')).toBeInTheDocument());
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('NoId Product')).toBeInTheDocument();
    expect(screen.getByText(/No id desc/)).toBeInTheDocument();
  });
 // ...existing code...

  it('API error -> does not crash (logs error)', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'mock-token', user: { name: 'Test' } }, setAuth]);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
          React.createElement(Orders, null)
        )
      )
    );

    await waitFor(() => expect(screen.getByText('All Orders')).toBeInTheDocument());
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('does not fetch when auth has no token', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: null }, setAuth]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
          React.createElement(Orders, null)
        )
      )
    );

    expect(axios.get).not.toHaveBeenCalled();
  });

  it('does not fetch when auth is undefined', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([undefined, setAuth]);

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Layout, null,
          React.createElement(Orders, null)
        )
      )
    );

    expect(axios.get).not.toHaveBeenCalled();
  });
  //added for 100% branch coverage
    it('renders order card using index key when order._id is missing', async () => {
    jest.spyOn(authHook, 'useAuth').mockReturnValue([{ token: 'mock-token', user: { name: 'Test' } }, setAuth]);

    // order intentionally missing _id to exercise `o._id || i` branch
    const mockOrdersNoId = [
    {
        status: 'Processing',
        buyer: { name: 'DZhang' },
        createAt: new Date().toISOString(),
        payment: { success: true },
        products: []
    }
    ];
    axios.get.mockResolvedValueOnce({ data: mockOrdersNoId });

    render(
        React.createElement(MemoryRouter, null,
            React.createElement(Layout, null,
                React.createElement(Orders, null)
            )
        )
    );

    await waitFor(() => expect(screen.getByText('Processing')).toBeInTheDocument());
    // verifies order rendered even though _id missing (fallback key used)
    expect(screen.getByText('DZhang')).toBeInTheDocument();
    });

});
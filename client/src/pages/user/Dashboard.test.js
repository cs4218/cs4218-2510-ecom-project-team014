import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Layout to avoid router/SEO concerns and expose the title prop
jest.mock('../../components/Layout', () => (props) => (
  <div data-testid="layout" data-title={props.title}>{props.children}</div>
));

// Mock UserMenu to a simple node
jest.mock('../../components/UserMenu', () => () => <nav>UserMenu</nav>);

// Mock useAuth to provide a user
jest.mock('../../context/auth', () => ({
  useAuth: () => [
    {
      user: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        address: '123 Main St',
      },
    },
  ],
}));

import Dashboard from './Dashboard';

describe('Dashboard', () => {
  test('renders layout, user menu, and user details', () => {
    render(<Dashboard />);

    // Layout receives the proper title
    const layout = screen.getByTestId('layout');
    expect(layout).toHaveAttribute('data-title', 'Dashboard - Ecommerce App');

    // UserMenu is rendered
    expect(screen.getByText('UserMenu')).toBeInTheDocument();

    // User details from useAuth
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });
});
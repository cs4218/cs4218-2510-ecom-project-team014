// UserMenu.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import UserMenu from './UserMenu';

describe('UserMenu', () => {
  test('renders Dashboard heading and links with correct hrefs', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    const profileLink = screen.getByRole('link', { name: 'Profile' });
    const ordersLink = screen.getByRole('link', { name: 'Orders' });

    expect(profileLink).toHaveAttribute('href', '/dashboard/user/profile');
    expect(ordersLink).toHaveAttribute('href', '/dashboard/user/orders');
  });

  test('marks Profile as active when route matches', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/user/profile']}>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByRole('link', { name: 'Profile' });
    expect(profileLink).toHaveAttribute('aria-current', 'page'); // active
    const ordersLink = screen.getByRole('link', { name: 'Orders' });
    expect(ordersLink).not.toHaveAttribute('aria-current');
  });

  test('marks Orders as active when route matches', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/user/orders']}>
        <UserMenu />
      </MemoryRouter>
    );

    const ordersLink = screen.getByRole('link', { name: 'Orders' });
    expect(ordersLink).toHaveAttribute('aria-current', 'page'); // active
    const profileLink = screen.getByRole('link', { name: 'Profile' });
    expect(profileLink).not.toHaveAttribute('aria-current');
  });
});
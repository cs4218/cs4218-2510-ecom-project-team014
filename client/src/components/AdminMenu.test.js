import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminMenu from '../components/AdminMenu';

describe('AdminMenu', () => {
  it('all expected admin navigation links should have correct href and text', () => {
    const { getByText } = render(
      <BrowserRouter>
        <AdminMenu />
      </BrowserRouter>
    );

    expect(getByText('Create Category').closest('a')).toHaveAttribute('href', '/dashboard/admin/create-category');
    expect(getByText('Create Product').closest('a')).toHaveAttribute('href', '/dashboard/admin/create-product');
    expect(getByText('Products').closest('a')).toHaveAttribute('href', '/dashboard/admin/products');
    expect(getByText('Orders').closest('a')).toHaveAttribute('href', '/dashboard/admin/orders');
  });

  it('should not render the commented out component', () => {
    const { getByText } = render(
      <BrowserRouter>
        <AdminMenu />
      </BrowserRouter>
    );

    expect(() => getByText('Users')).toThrow();
  });

  it('renders all components of the AdminMenu correctly', () => {
    const { getByText } = render(
      <BrowserRouter>
        <AdminMenu />
      </BrowserRouter>
    );

    expect(getByText('Admin Panel')).toBeInTheDocument();
    expect(getByText('Create Category')).toBeInTheDocument();
    expect(getByText('Create Product')).toBeInTheDocument();
    expect(getByText('Products')).toBeInTheDocument();
    expect(getByText('Orders')).toBeInTheDocument();
  });
});

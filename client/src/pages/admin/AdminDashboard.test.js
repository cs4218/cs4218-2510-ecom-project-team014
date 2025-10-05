import React from 'react';
import { render } from '@testing-library/react';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../../context/auth';

jest.mock('./../../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock('../../components/AdminMenu', () => () => <div data-testid="admin-menu">AdminMenu</div>);
jest.mock('../../context/auth');

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Layout and AdminMenu components', () => {
    useAuth.mockReturnValue([{ user: { name: 'Admin User', email: 'admin@example.com', phone: '123456789' } }]);

    const { getByTestId } = render(<AdminDashboard />);

    expect(getByTestId('layout')).toBeInTheDocument();
    expect(getByTestId('admin-menu')).toBeInTheDocument();
  });

  it('displays admin user details properly', () => {
    const mockUser = {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '123456789',
    };
    useAuth.mockReturnValue([{ user: mockUser }]);

    const { getByText } = render(<AdminDashboard />);

    expect(getByText(`Admin Name : ${mockUser.name}`)).toBeInTheDocument();
    expect(getByText(`Admin Email : ${mockUser.email}`)).toBeInTheDocument();
    expect(getByText(`Admin Contact : ${mockUser.phone}`)).toBeInTheDocument();
  });

  it('handles missing user gracefully', () => {
    useAuth.mockReturnValue([{ user: null }]);

    const { getByText } = render(<AdminDashboard />);

    expect(getByText('Admin Name :')).toBeInTheDocument();
    expect(getByText('Admin Email :')).toBeInTheDocument();
    expect(getByText('Admin Contact :')).toBeInTheDocument();
  });
});

// Above tests are generated with the help of AI
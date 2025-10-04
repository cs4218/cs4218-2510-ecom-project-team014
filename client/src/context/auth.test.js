import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  const TestComponent = () => {
    const [auth, setAuth] = useAuth();

    // Render current auth state as JSON and a button to update it
    return (
      <div>
        <pre data-testid="authState">{JSON.stringify(auth)}</pre>
        <button onClick={() => setAuth({ user: { name: 'Test User' }, token: 'token123' })}>
          Update Auth
        </button>
      </div>
    );
  };

  it('should provide default auth state', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('authState').textContent).toBe(JSON.stringify({ user: null, token: '' }));
  });

  it('should restore auth state from localStorage on mount', async () => {
    const storedData = {
      user: { name: 'Stored User' },
      token: 'storedtoken',
    };
    localStorage.setItem('auth', JSON.stringify(storedData));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for useEffect to update state
    await waitFor(() => {
      expect(getByTestId('authState').textContent).toBe(JSON.stringify(storedData));
    });
  });

  it('should update auth state when setAuth is called', () => {
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('authState').textContent).toBe(JSON.stringify({ user: null, token: '' }));

    getByText('Update Auth').click();

    expect(getByTestId('authState').textContent).toBe(JSON.stringify({ user: { name: 'Test User' }, token: 'token123' }));
  });

  it('should set axios default Authorization header', () => {
    // Initially axios.defaults.headers.common['Authorization'] should be ''
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined();

    const TestComponentSetToken = () => {
      const [auth, setAuth] = useAuth();

      React.useEffect(() => {
        setAuth({ user: { name: 'User' }, token: 'mytoken' });
      }, []);

      return null;
    };

    render(
      <AuthProvider>
        <TestComponentSetToken />
      </AuthProvider>
    );

    // Note: Because axios.defaults are set synchronously in AuthProvider render,
    // this test verifies that after rendering, axios.defaults have the token
    expect(axios.defaults.headers.common['Authorization']).toBe('mytoken');
  });
});

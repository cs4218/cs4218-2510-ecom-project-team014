import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import axios from 'axios';
import { act } from '@testing-library/react';

jest.mock('axios');

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const TestComponent = () => {
    const [auth, setAuth] = useAuth();

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

    act(() => {
      getByText('Update Auth').click();
    });

    expect(getByTestId('authState').textContent).toBe(JSON.stringify({ user: { name: 'Test User' }, token: 'token123' }));
  });

  it('should set axios default Authorization header', () => {
    axios.defaults.headers.common['Authorization'] = '';

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

    expect(axios.defaults.headers.common['Authorization']).toBe('mytoken');
  });
});

// Above tests are generated with the help of AI

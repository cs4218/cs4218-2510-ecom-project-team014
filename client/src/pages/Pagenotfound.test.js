import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Pagenotfound from './Pagenotfound';

// Mock Layout to isolate Pagenotfound
jest.mock('./../components/Layout', () => ({ children, title }) => (
  <div data-testid="mock-layout" data-title={title}>{children}</div>
));

describe('Pagenotfound', () => {
  it('renders 404 page with correct title and content', () => {
    const { getByTestId, getByText } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );
    // Layout is rendered with correct title
    expect(getByTestId('mock-layout')).toHaveAttribute('data-title', 'go back- page not found');
    // 404 title
    expect(getByText('404')).toBeInTheDocument();
    // Heading
    expect(getByText(/Oops ! Page Not Found/i)).toBeInTheDocument();
    // Go Back link
    const goBackLink = getByText('Go Back');
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink.closest('a')).toHaveAttribute('href', '/');
    expect(goBackLink).toHaveClass('pnf-btn');
  });
});
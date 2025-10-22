import React from 'react';
import { render } from '@testing-library/react';
import About from './About';

// Mock Layout to isolate About
jest.mock('./../components/Layout', () => ({ children, title }) => (
  <div data-testid="mock-layout" data-title={title}>{children}</div>
));

describe('About', () => {
  it('renders About page with correct title and content', () => {
    const { getByTestId, getByText, getByAltText } = render(<About />);
    // Layout has correct title
    expect(getByTestId('mock-layout')).toHaveAttribute('data-title', 'About us - Ecommerce app');
    // Image alt text is correct
    expect(getByAltText('contactus')).toBeInTheDocument();
    // Text from paragraph is correct
    expect(getByText('Add text')).toBeInTheDocument();
    // Image src is correct
    expect(getByAltText('contactus')).toHaveAttribute('src', '/images/about.jpeg');
    // Image style width is 100%
    expect(getByAltText('contactus').style.width).toBe('100%');
    // Paragraph has correct classes
    expect(getByText('Add text')).toHaveClass('text-justify', 'mt-2');
  });
});
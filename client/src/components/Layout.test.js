import React from 'react';
import { render } from '@testing-library/react';
import Layout from './Layout';

// Mock Header, Footer, Toaster, Helmet
jest.mock('./Header', () => () => <div data-testid="mock-header">HeaderMock</div>);
jest.mock('./Footer', () => () => <div data-testid="mock-footer">FooterMock</div>);
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="mock-toaster">ToasterMock</div>
}));
jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => <>{children}</>
}));

describe('Layout exhaustive tests', () => {
  // Children: no children
  it('renders with no children', () => {
    const { getByTestId } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="Auth" />
    );
    expect(getByTestId('mock-header')).toBeInTheDocument();
    expect(getByTestId('mock-footer')).toBeInTheDocument();
    expect(getByTestId('mock-toaster')).toBeInTheDocument();
  });

  // Children: one child
  it('renders with one child', () => {
    const { getByText } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="Auth">
        <div>SingleChild</div>
      </Layout>
    );
    expect(getByText('SingleChild')).toBeInTheDocument();
  });

  // Children: multiple children
  it('renders with multiple children', () => {
    const { getByText } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="Auth">
        <span>Child1</span>
        <span>Child2</span>
      </Layout>
    );
    expect(getByText('Child1')).toBeInTheDocument();
    expect(getByText('Child2')).toBeInTheDocument();
  });

  // Title: a string
  it('sets document title to a string', () => {
    render(
      <Layout title="Custom Title" description="Desc" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(document.title).toBe('Custom Title');
  });

  // Title: empty string
  it('sets document title to empty string', () => {
    render(
      <Layout title="" description="Desc" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(document.title).toBe('');
  });

  // Description: a string
  it('renders with a description string', () => {
    const { container } = render(
      <Layout title="Title" description="Custom Description" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="description"]').content).toBe('Custom Description');
  });

  // Description: empty string
  it('renders with empty description', () => {
    const { container } = render(
      <Layout title="Title" description="" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="description"]').content).toBe('');
  });

  // Keywords: a string
  it('renders with keywords string', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="custom,keywords" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="keywords"]').content).toBe('custom,keywords');
  });

  // Keywords: empty string
  it('renders with empty keywords', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="keywords"]').content).toBe('');
  });

  // Author: a string
  it('renders with author string', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="Custom Author">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="author"]').content).toBe('Custom Author');
  });

  // Author: empty string
  it('renders with empty author', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="author"]').content).toBe('');
  });
});
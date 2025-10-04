import React from 'react';
import { render } from '@testing-library/react';
import Layout from './Layout';

// AI Disclaimer: The following test code was generated with the assistance of AI.

// Mock Header, Footer, Toaster, Helmet
jest.mock('./Header', () => () => <div data-testid="mock-header">HeaderMock</div>);
jest.mock('./Footer', () => () => <div data-testid="mock-footer">FooterMock</div>);
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="mock-toaster">ToasterMock</div>
}));
jest.mock('react-helmet', () => ({
  Helmet: ({ children }) => <>{children}</>
}));

describe('Layout tests', () => {
  // 1. No children
  it('renders with no children', () => {
    const { getByTestId } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="Auth" />
    );
    expect(getByTestId('mock-header')).toBeInTheDocument();
    expect(getByTestId('mock-footer')).toBeInTheDocument();
    expect(getByTestId('mock-toaster')).toBeInTheDocument();
  });

  // 2. One child
  it('renders with one child', () => {
    const { getByText } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="Auth">
        <div>SingleChild</div>
      </Layout>
    );
    expect(getByText('SingleChild')).toBeInTheDocument();
  });

  // 3. Multiple children
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

  // 4. Title: present string
  it('sets document title to a string', () => {
    render(
      <Layout title="Custom Title" description="Desc" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(document.title).toBe('Custom Title');
  });

  // 5. Title: empty string
  it('sets document title to empty string', () => {
    render(
      <Layout title="" description="Desc" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(document.title).toBe('');
  });

  // 6. Title: null string, defaults to "Ecommerce app - shop now"
  it('sets document title to default when title is null', () => {
    render(
      <Layout description="Desc" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(document.title).toBe('Ecommerce app - shop now');
  });

  // 7. Description: present string
  it('renders with a description string', () => {
    const { container } = render(
      <Layout title="Title" description="Custom Description" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="description"]').content).toBe('Custom Description');
  });

  // 8. Description: empty string
  it('renders with empty description', () => {
    const { container } = render(
      <Layout title="Title" description="" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="description"]').content).toBe('');
  });

  // 9. Description: null, defaults to "mern stack project"
  it('renders with default description when null', () => {
    const { container } = render(
      <Layout title="Title" keywords="Key" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="description"]').content).toBe('mern stack project');
  });

  // 10. Keywords: present string
  it('renders with keywords string', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="custom,keywords" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="keywords"]').content).toBe('custom,keywords');
  });

  // 11. Keywords: empty string
  it('renders with empty keywords', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="keywords"]').content).toBe('');
  });

  // 12. Keywords: null, defaults to "mern,react,node,mongodb"
  it('renders with default keywords when null', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" author="Auth">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="keywords"]').content).toBe('mern,react,node,mongodb');
  });

  // 13. Author: present string
  it('renders with author string', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="Custom Author">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="author"]').content).toBe('Custom Author');
  });

  // 14. Author: empty string
  it('renders with empty author', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="Key" author="">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="author"]').content).toBe('');
  });

  // 15. Author: null, defaults to "Techinfoyt"
  it('renders with default author when null', () => {
    const { container } = render(
      <Layout title="Title" description="Desc" keywords="Key">
        <div>Child</div>
      </Layout>
    );
    expect(container.querySelector('meta[name="author"]').content).toBe('Techinfoyt');
  });
});
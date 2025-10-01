import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer', () => {
    it('should render footer text', () => {
        const { getByText } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );
        expect(getByText(/All Rights Reserved/i)).toBeInTheDocument();
    });

    it('should render links: About, Contact, and Privacy Policy', () => {
        const { getByText } = render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );
        expect(getByText('About').closest('a')).toHaveAttribute('href', '/about');
        expect(getByText('Contact').closest('a')).toHaveAttribute('href', '/contact');
        expect(getByText('Privacy Policy').closest('a')).toHaveAttribute('href', '/policy');
    });
});
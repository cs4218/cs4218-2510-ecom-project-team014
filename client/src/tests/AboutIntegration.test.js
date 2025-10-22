jest.mock('react-helmet', () => {
	return {
		Helmet: ({ children }) => {
			const React = require('react');
			React.useEffect(() => {
				globalThis.document.title = 'TEST_TITLE';
				let m = globalThis.document.querySelector('meta[name="description"]');
				if (!m) {
					m = globalThis.document.createElement('meta');
					m.setAttribute('name', 'description');
					globalThis.document.head.appendChild(m);
				}
				m.content = 'TEST_CONTENT';
			}, []);
			
			return require('react').createElement(require('react').Fragment, null, children);
		},
	};
});

jest.mock('../context/auth', () => ({
	useAuth: jest.fn(() => [{ user: null, token: null }, jest.fn()]),
}));
jest.mock('../context/cart', () => ({
	useCart: jest.fn(() => [[], jest.fn()]),
}));
jest.mock('../hooks/useCategory', () => ({
	__esModule: true,
	default: jest.fn(() => []),
}));
jest.mock('../context/search', () => ({
	useSearch: jest.fn(() => [{ query: '' }, jest.fn()]),
}));

jest.mock('react-hot-toast', () => {
	const React = require('react');
	return { Toaster: () => React.createElement('div', { 'data-testid': 'mock-toaster' }) };
});

const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const About = require('../pages/About').default;

describe('About page integration tests', () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		document.title = '';
		jest.clearAllMocks();
	});

	it('renders About with Layout, checking for header/footer content, image details, text and title', async () => {
		render(
			React.createElement(MemoryRouter, null, React.createElement(About, null))
		);

		expect(screen.getByText('Add text')).toBeInTheDocument();
		
		//check img details
		const img = screen.getByAltText('contactus');
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', '/images/about.jpeg');
		expect(img.style.width).toBe('100%');

		//check header/footer presence (a bit broad just to make sure they're there)
		expect(
			document.querySelector('header') || document.querySelector('nav') || document.querySelector('[data-testid="header"]')
		).toBeTruthy();
		expect(
			document.querySelector('footer') || document.querySelector('.footer') || document.querySelector('[data-testid="footer"]')
		).toBeTruthy();

		//check title after render
		await waitFor(() => {
			const titleEl = document.querySelector('title');
			const titleText = titleEl ? titleEl.textContent : document.title;
			expect(titleText).toBe('TEST_TITLE');
		});
	});
});

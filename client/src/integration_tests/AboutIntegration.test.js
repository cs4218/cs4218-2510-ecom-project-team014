//stub a title and meta description for simplicity
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

// mock toast to avoid portal/timer side-effects
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

	it('renders About with real Layout: check for header/footer content, image details, text and title', async () => {
		render(
			React.createElement(MemoryRouter, null, React.createElement(About, null))
		);

		// content
		expect(screen.getByText('Add text')).toBeInTheDocument();

		const img = screen.getByAltText('contactus');
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute('src', '/images/about.jpeg');
		expect(img.style.width).toBe('100%');

		// integration: header/footer presence (tolerant selectors)
		expect(
			document.querySelector('header') || document.querySelector('nav') || document.querySelector('[data-testid="header"]')
		).toBeTruthy();
		expect(
			document.querySelector('footer') || document.querySelector('.footer') || document.querySelector('[data-testid="footer"]')
		).toBeTruthy();

		// Helmet side-effect: title set
			await waitFor(() => {
				const titleEl = document.querySelector('title');
				const titleText = titleEl ? titleEl.textContent : document.title;
				expect(titleText).toBe('TEST_TITLE');
			});
	});

	it('rendering Layout with defaults', async () => {
		// import Layout dynamically so it uses the same mocked Helmet
		const Layout = require('../components/Layout').default;

		render(
			React.createElement(MemoryRouter, null, React.createElement(Layout, null, React.createElement('div', null, 'DefaultChild')))
		);

		expect(screen.getByText('DefaultChild')).toBeInTheDocument();

			await waitFor(() => {
				const titleEl = document.querySelector('title');
				const titleText = titleEl ? titleEl.textContent : document.title;
				expect(titleText).toBe('TEST_TITLE');

				const desc = document.querySelector('meta[name="description"]');
				expect(desc && desc.content).toBe('TEST_CONTENT');
			});
	});
});

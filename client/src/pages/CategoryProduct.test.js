import React from "react";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import * as Router from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";

// --- Mock axios
jest.mock("axios");

// --- Mock Layout so tests don’t render your full chrome
jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout-mock">{children}</div>,
}));

// --- Delegates we can override per test for router hooks
const mockUseNavigateImpl = jest.fn();
const mockUseParamsImpl = jest.fn();

// Partial mock: keep everything from RRD except the two hooks
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockUseNavigateImpl(),
    useParams: () => mockUseParamsImpl(),
  };
});

// Helper to render with MemoryRouter
const renderWithRouter = (ui) =>
  render(<Router.MemoryRouter>{ui}</Router.MemoryRouter>);

// --- Fixtures
const category = { _id: "c9", name: "Shoes" };
const products = [
  {
    _id: "p1",
    name: "Mint Runner",
    description: "Lightweight road shoe",
    price: 149.99,
    slug: "mint-runner",
  },
  {
    _id: "p2",
    name: "Mint Runner Pro",
    description: "Pro version with carbon plate",
    price: 299,
    slug: "mint-runner-pro",
  },
];
const successResponse = { category, products };

describe("<CategoryProduct />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Defaults so the effect runs
    mockUseParamsImpl.mockReturnValue({ slug: "shoes" });
    mockUseNavigateImpl.mockReturnValue(jest.fn());
  });

  it("happy path - loads category by slug and renders products list with formatted prices", async () => {
    axios.get.mockResolvedValueOnce({ data: successResponse });

    renderWithRouter(<CategoryProduct />);

    // Wait until the request fired (and state flushed)
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    // Correct URL
    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/shoes"
    );

    // Headings
    expect(
      await screen.findByRole("heading", { name: /category - shoes/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/result found/i)).toHaveTextContent(
      "2 result found"
    );

    // Cards
    for (const p of products) {
      const title = await screen.findByRole("heading", {
        level: 5,
        name: p.name,
      });
      const card = title.closest(".card");
      expect(card).toBeInTheDocument();

      // Image src
      const img = within(card).getByRole("img", { name: p.name });
      expect(img).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${p._id}`
      );

      // USD price formatting
      const price = within(card).getByText(/\$/);
      expect(price).toHaveTextContent(
        p.price.toLocaleString("en-US", { style: "currency", currency: "USD" })
      );

      // More Details button present
      expect(
        within(card).getByRole("button", { name: /more details/i })
      ).toBeInTheDocument();
    }
  });

  it("shows 0 result when API returns empty products", async () => {
    axios.get.mockResolvedValueOnce({ data: { category, products: [] } });

    renderWithRouter(<CategoryProduct />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    expect(
      await screen.findByRole("heading", { name: /category - shoes/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/result found/i)).toHaveTextContent(
      "0 result found"
    );
    // No cards present
    expect(
      screen.queryByRole("heading", { level: 5, name: products[0].name })
    ).not.toBeInTheDocument();
  });

  it("navigates to product details when clicking More Details on a specific card", async () => {
    const navigateMock = jest.fn();
    mockUseNavigateImpl.mockReturnValue(navigateMock);
    axios.get.mockResolvedValueOnce({ data: successResponse });

    renderWithRouter(<CategoryProduct />);

    // Scope to the "Mint Runner Pro" card
    const proHeading = await screen.findByRole("heading", {
      level: 5,
      name: "Mint Runner Pro",
    });
    const proCard = proHeading.closest(".card");
    const btn = within(proCard).getByRole("button", { name: /more details/i });

    fireEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledWith("/product/mint-runner-pro");
  });

  it("does nothing when slug is missing (no API call)", async () => {
    mockUseParamsImpl.mockReturnValue({}); // no slug
    // axios.get.mockResolvedValueOnce({ data: successResponse });

    renderWithRouter(<CategoryProduct />);

    // No API call when slug missing
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(0));

    // Base UI still renders (layout + headings)
    expect(
      screen.getByRole("heading", { name: /category -/i })
    ).toBeInTheDocument();
  });

  it("logs error and does not crash when the category request fails", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    renderWithRouter(<CategoryProduct />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(logSpy).toHaveBeenCalled());
    logSpy.mockRestore();
  });

  // --- Robustness / edge-case exposures ---

  it("handles undefined products from API (hardened code by defaulting to [])", async () => {
    axios.get.mockResolvedValueOnce({
      data: { category, products: undefined },
    });

    renderWithRouter(<CategoryProduct />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    // Should now show "0 result found"
    expect(screen.getByText(/result found/i)).toHaveTextContent(
      "0 result found"
    );

    // Still no cards rendered
    expect(screen.queryByRole("heading", { level: 5 })).not.toBeInTheDocument();
  });

  it("exposes bug: clicking More Details navigates to /product/undefined if product.slug is missing", async () => {
    const navigateMock = jest.fn();
    mockUseNavigateImpl.mockReturnValue(navigateMock);

    const bad = {
      category,
      products: [{ ...products[0], slug: undefined }], // missing slug
    };
    axios.get.mockResolvedValueOnce({ data: bad });

    renderWithRouter(<CategoryProduct />);

    const heading = await screen.findByRole("heading", {
      level: 5,
      name: "Mint Runner",
    });
    const card = heading.closest(".card");
    const btn = within(card).getByRole("button", { name: /more details/i });

    fireEvent.click(btn);

    // error if not hardened
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

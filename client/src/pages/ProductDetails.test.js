// LLM tools were referenced to help write the test cases.

import React from "react";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import * as Router from "react-router-dom";
import ProductDetails from "./ProductDetails";
import axios from "axios";

const mockUseNavigateImpl = jest.fn();
const mockUseParamsImpl = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: () => mockUseParamsImpl(),
    useNavigate: () => mockUseNavigateImpl(),
  };
});

jest.mock("axios");

// So layout dependencies will not affect test results.
jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout-mock">{children}</div>,
}));

const renderWithRouter = (ui) =>
  render(<Router.MemoryRouter>{ui}</Router.MemoryRouter>);

const productResponse = {
  product: {
    _id: "p123",
    name: "Mint Runner",
    description: "Lightweight road shoe",
    price: 149.99,
    category: { _id: "c9", name: "Shoes" },
    slug: "mint-runner",
  },
};

const relatedResponse = {
  products: [
    {
      _id: "rp1",
      name: "Mint Runner Pro",
      description: "Pro version with carbon plate for races",
      price: 299,
      slug: "mint-runner-pro",
    },
    {
      _id: "rp2",
      name: "Mint Trainer",
      description: "Daily trainer with plush cushion",
      price: 169.5,
      slug: "mint-trainer",
    },
  ],
};

describe("unit test: <ProductDetails />", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseParamsImpl.mockReturnValue({ slug: "mint-runner" });
    mockUseNavigateImpl.mockReturnValue(jest.fn());
  });

  it("happy path - loads product by slug, then loads related products, and renders details", async () => {
    axios.get
      .mockResolvedValueOnce({ data: productResponse })
      .mockResolvedValueOnce({ data: relatedResponse });

    renderWithRouter(<ProductDetails />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    // Main product image (use exact name)
    const mainImg = screen.getByRole("img", { name: "Mint Runner" });
    expect(mainImg).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/p123"
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/product/get-product/mint-runner"
    );
    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/product/related-product/p123/c9"
    );
  });

  it("does nothing when slug is missing", async () => {
    mockUseParamsImpl.mockReturnValue({}); // no slug
    mockUseNavigateImpl.mockReturnValue(jest.fn());

    renderWithRouter(<ProductDetails />);

    // No API calls should happen
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(0));
    expect(
      screen.getByRole("heading", { name: /product details/i })
    ).toBeInTheDocument();
  });

  it("shows 'No Similar Products found' when none are returned", async () => {
    axios.get
      .mockResolvedValueOnce({ data: productResponse })
      .mockResolvedValueOnce({ data: { products: [] } });

    renderWithRouter(<ProductDetails />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText(/no similar products found/i)
    ).toBeInTheDocument();
  });

  it("handles undefined related products safely", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get
      .mockResolvedValueOnce({ data: productResponse })
      .mockResolvedValueOnce({ data: undefined }); // related returns undefined

    renderWithRouter(<ProductDetails />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText(/no similar products found/i)
    ).toBeInTheDocument();
    logSpy.mockRestore();
  });

  it("navigates when clicking More Details on a related product", async () => {
    const navigateMock = jest.fn();
    mockUseNavigateImpl.mockReturnValue(navigateMock);
    axios.get
      .mockResolvedValueOnce({ data: productResponse })
      .mockResolvedValueOnce({ data: relatedResponse });

    renderWithRouter(<ProductDetails />);

    // Wait for related products UI (flushes setRelatedProducts)
    const proHeading = await screen.findByRole("heading", {
      name: "Mint Runner Pro",
    });
    const proCard = proHeading.closest(".card");
    const btn = within(proCard).getByRole("button", { name: /more details/i });
    fireEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledWith("/product/mint-runner-pro");
  });

  it("does not navigate if related product has no slug (guarded)", async () => {
    const navigateMock = jest.fn();
    mockUseNavigateImpl.mockReturnValue(navigateMock);
    const badRelated = {
      products: [{ ...relatedResponse.products[0], slug: undefined }],
    };
    axios.get
      .mockResolvedValueOnce({ data: productResponse })
      .mockResolvedValueOnce({ data: badRelated });

    renderWithRouter(<ProductDetails />);

    const heading = await screen.findByRole("heading", {
      name: /mint runner pro/i,
    });
    const card = heading.closest(".card");
    const btn = within(card).getByRole("button", { name: /more details/i });
    fireEvent.click(btn);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("logs error and does not crash when first request rejects", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    renderWithRouter(<ProductDetails />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(logSpy).toHaveBeenCalled());

    logSpy.mockRestore();
  });

  it("logs error and does not crash when related products request failed", async () => {
    mockUseParamsImpl.mockReturnValue({ slug: "mint-runner" });
    mockUseNavigateImpl.mockReturnValue(jest.fn());
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get
      .mockResolvedValueOnce({ data: productResponse }) // get-product success
      .mockRejectedValueOnce(new Error("Network error")); // error

    renderWithRouter(<ProductDetails />);

    // first request happened; second attempted and failed
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(logSpy).toHaveBeenCalled());
    // With no related products set (state remains []), empty-state shows:
    expect(
      await screen.findByText(/no similar products found/i)
    ).toBeInTheDocument();

    logSpy.mockRestore();
  });

  it("exposes a bug when product is null (accessing data?.product._id without optional chaining)", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockResolvedValueOnce({ data: { product: null } });

    renderWithRouter(<ProductDetails />);

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(logSpy).toHaveBeenCalled());

    logSpy.mockRestore();
  });
});

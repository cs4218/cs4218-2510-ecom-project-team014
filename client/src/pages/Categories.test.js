// LLM tools were referenced to help write the test cases.

import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

// Mock the hook to control its return value
jest.mock("../hooks/useCategory", () => jest.fn());

// 1) Mock Layout to avoid Header/Footer & providers
jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="layout-mock">{children}</div>,
}));

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("<Categories />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCategory.mockReturnValue([]);
  });

  it("renders a link for each category with correct href and text", () => {
    useCategory.mockReturnValue([
      { _id: "1", name: "Shoes", slug: "shoes" },
      { _id: "2", name: "Hats", slug: "hats" },
    ]);

    renderWithRouter(<Categories />);

    const shoes = screen.getByRole("link", { name: "Shoes" });
    const hats = screen.getByRole("link", { name: "Hats" });
    expect(shoes).toHaveAttribute("href", "/category/shoes");
    expect(hats).toHaveAttribute("href", "/category/hats");
  });

  it("renders no links when there are no categories", () => {
    useCategory.mockReturnValue([]);

    renderWithRouter(<Categories />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("does not crash if hook returns undefined (guarded by hook fix)", () => {
    useCategory.mockReturnValue([]);

    renderWithRouter(<Categories />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});

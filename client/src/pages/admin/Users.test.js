// LLM tools were referenced to help write the test cases.

import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";

// --- Mock child components so this is a focused unit test ---
jest.mock("../../components/AdminMenu", () => () => (
  <nav data-testid="admin-menu">Admin Menu</nav>
));

const layoutProps = { last: null };
jest.mock("../../components/Layout", () => {
  // eslint-disable-next-line react/prop-types
  return function LayoutMock(props) {
    layoutProps.last = props;
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{String(props.title)}</div>
        {props.children}
      </div>
    );
  };
});

describe("<Users />", () => {
  it("renders without crashing", () => {
    render(<Users />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("renders AdminMenu exactly once", () => {
    render(<Users />);

    const menu = screen.getByTestId("admin-menu");
    expect(menu).toBeInTheDocument();
    // Ensure only one AdminMenu
    expect(screen.getAllByTestId("admin-menu")).toHaveLength(1);
  });
});

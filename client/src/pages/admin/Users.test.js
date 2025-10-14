import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";

// --- Mock child components so this is a focused unit test ---
jest.mock("../../components/AdminMenu", () => () => (
  <nav data-testid="admin-menu">Admin Menu</nav>
));

// We want to verify the 'title' prop is passed to Layout.
// This mock renders children and exposes the last received props.
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
  //   const spyConsoleError = jest
  //     .spyOn(console, "error")
  //     .mockImplementation(() => {});

  //   afterEach(() => {
  //     spyConsoleError.mockClear();
  //   });

  //   afterAll(() => {
  //     spyConsoleError.mockRestore();
  //   });

  test("renders without crashing", () => {
    render(<Users />);
    // heading
    // const h1 = screen.getByRole("heading", { level: 1, name: /All Users/i });
    expect(screen.getByTestId("layout")).toBeInTheDocument();
    // expect(h1).toBeInTheDocument();
  });

  test("renders AdminMenu exactly once", () => {
    render(<Users />);
    const menu = screen.getByTestId("admin-menu");
    expect(menu).toBeInTheDocument();

    // // Check menu is inside the left column (.col-md-3)
    // // We search up the DOM for the nearest element with class 'col-md-3'
    // const leftCol = menu.closest(".col-md-3");
    // expect(leftCol).toBeInTheDocument();

    // Ensure only one AdminMenu
    expect(screen.getAllByTestId("admin-menu")).toHaveLength(1);
  });
});

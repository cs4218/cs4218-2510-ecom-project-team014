import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null, token: null }, jest.fn()]),
}));
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));
jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));
jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ query: "" }, jest.fn()]),
}));
jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="mock-toaster" />,
}));

// import layout after the mocks to use them
import Layout from "../components/Layout";

describe("Layout integration tests", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.title = "";
    jest.clearAllMocks();
  });

  
  it("renders header, footer, toaster and children and sets document title", async () => {
    render(
      <MemoryRouter>
        <Layout
          title="Integration Title"
          description="Desc"
          keywords="key1,key2"
          author="AuthName"
        >
          <div>IntegrationChild</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText("IntegrationChild")).toBeInTheDocument();

    //check header
    expect(
      document.querySelector("header") ||
        document.querySelector("[data-testid='header']") ||
        document.querySelector("nav")
    ).toBeTruthy();

    //check footer
    expect(
      document.querySelector("footer") ||
        document.querySelector("[data-testid='footer']") ||
        document.querySelector(".footer")
    ).toBeTruthy();

    //check metadata
    await waitFor(() => {
      const titleEl = document.querySelector("title");
      const titleText = titleEl ? titleEl.textContent : document.title;
      expect(titleText).toBe("Integration Title");

     
      const desc = document.querySelector('meta[name="description"]');
      const keys = document.querySelector('meta[name="keywords"]');
      const auth = document.querySelector('meta[name="author"]');
      expect(desc && desc.content).toBe("Desc");
      expect(keys && keys.content).toBe("key1,key2");
      expect(auth && auth.content).toBe("AuthName");
    });
  });


  it("uses defaults with no props passed through", async () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>DefaultChild</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText("DefaultChild")).toBeInTheDocument();

    await waitFor(() => {
      //default title
      expect(document.title).toBe("Ecommerce app - shop now");

      //default meta values
      const desc = document.querySelector('meta[name="description"]');
      const keys = document.querySelector('meta[name="keywords"]');
      const auth = document.querySelector('meta[name="author"]');
      expect(desc && desc.content).toBe("mern stack project");
      expect(keys && keys.content).toBe("mern,react,node,mongodb");
      expect(auth && auth.content).toBe("Techinfoyt");
    });
  });

  
  it("accepts empty strings for meta props", async () => {
    render(
      <MemoryRouter>
        <Layout title="" description="" keywords="" author="">
          <div>EmptyChild</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText("EmptyChild")).toBeInTheDocument();

    
    await waitFor(() => {
      expect(document.title).toBe("");

      const desc = document.querySelector('meta[name="description"]');
      const keys = document.querySelector('meta[name="keywords"]');
      const auth = document.querySelector('meta[name="author"]');

      //ensure tag is null (if it renders the value is "" (empty))
      expect(desc ? desc.content : null).toBe(null);
      expect(keys ? keys.content : null).toBe(null);
      expect(auth ? auth.content : null).toBe(null);
    });
  });
});
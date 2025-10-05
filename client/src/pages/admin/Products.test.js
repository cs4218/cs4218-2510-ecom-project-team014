import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Products from './Products';


// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));
  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));  

jest.mock("../../hooks/useCategory", ()=> jest.fn(()=>[]));


 Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };



describe('Products Component', () => {
    beforeEach(() => {
    jest.clearAllMocks();
  });

    it("renders heading and AdminMenu", () => {
        const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={["/admin/products"]}>
        <Routes>
          <Route path="/admin/products" element={<Products />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText("All Products List")).toBeInTheDocument();
  });

  it("loads and sets products successfully - covers setProducts(data.products)", async () => {
  const mockProducts = [
    { _id: "1", name: "Product 1", price: 100, slug: "product-1" },
    { _id: "2", name: "Product 2", price: 200, slug: "product-2" },
  ];


  axios.get.mockResolvedValueOnce({
    data: { success: true, products: mockProducts },
  });

  const { getByText } = render(
    <MemoryRouter initialEntries={["/admin/products"]}>
      <Routes>
        <Route path="/admin/products" element={<Products />} />
      </Routes>
    </MemoryRouter>
  );


  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");

    expect(getByText("Product 1")).toBeInTheDocument();
    expect(getByText("Product 2")).toBeInTheDocument();
  });
});


});
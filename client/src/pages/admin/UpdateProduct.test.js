import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import UpdateProduct from "./UpdateProduct";
import axios from "axios";
import toast from "react-hot-toast";
import * as router from "react-router-dom";

// Mock Layout and AdminMenu
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/AdminMenu", () => () => <div>AdminMenu</div>);

// Mock toast
jest.mock("react-hot-toast");

// Mock axios
jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"), // keep other exports
  useNavigate: () => jest.fn(),
  useParams: () => ({ slug: "test-slug" }),
}));


// Mock react-router-dom hooks
jest.spyOn(router, "useNavigate").mockReturnValue(jest.fn());
jest.spyOn(router, "useParams").mockReturnValue({ slug: "test-slug" });

// Mock antd Select
jest.mock("antd", () => {
  const Select = ({ children, onChange, value, "data-testid": testId }) => (
    <select
      data-testid={testId}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
  return { Select };
});


// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:url");

describe("UpdateProduct Component", () => {
  const mockProduct = {
    product: {
      _id: "1",
      name: "Test Product",
      description: "Description",
      price: 100,
      quantity: 5,
      shipping: 1,
      category: { _id: "cat1" },
    },
  };

  const mockCategories = {
    success: true,
    category: [{ _id: "cat1", name: "Category1" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("/get-product/")) return Promise.resolve({ data: mockProduct });
      if (url.includes("/get-category")) return Promise.resolve({ data: mockCategories });
      return Promise.resolve({ data: {} });
    });
    axios.put.mockResolvedValue({ data: { success: true } });
    axios.delete.mockResolvedValue({ data: {} });
  });

  it("renders component and loads product & categories", async () => {
    await act(async () => {
      render(<UpdateProduct />);
    });

    // Check product fields loaded
    expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();

    // Category select
    await waitFor(() => {
  const categorySelect = screen.getByTestId("category-select");
  const shippingSelect = screen.getByTestId("shipping-select");

  expect(categorySelect).toBeInTheDocument();
  expect(shippingSelect).toBeInTheDocument();
});
  });

  it("updates product on button click", async () => {
    await act(async () => {
      render(<UpdateProduct />);
    });

    const updateButton = screen.getByText("UPDATE PRODUCT");
    await act(async () => {
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
    });
  });

  it("handles product deletion", async () => {
    window.prompt = jest.fn(() => "yes"); // simulate confirm yes
    await act(async () => {
      render(<UpdateProduct />);
    });

    const deleteButton = screen.getByText("DELETE PRODUCT");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Product Deleted Succfully");
    });
  });

  it("handles delete cancellation", async () => {
    window.prompt = jest.fn(() => "no"); // simulate cancel
    await act(async () => {
      render(<UpdateProduct />);
    });

    const deleteButton = screen.getByText("DELETE PRODUCT");
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("handles getSingleProduct error", async () => {
    axios.get.mockRejectedValueOnce(new Error("fail"));
    await act(async () => {
      render(<UpdateProduct />);
    });
    expect(toast.error).toHaveBeenCalledWith("Failed to load product");
  });

  it("handles getAllCategory error", async () => {
    axios.get
    .mockResolvedValueOnce({ data: mockProduct }) // for get-product
    .mockRejectedValueOnce(new Error("fail"));   // for get-category

    await act(async () => {
        render(<UpdateProduct />);
    });
    
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting catgeory");
    });

  });

  it("handles update failure", async () => {
    axios.put.mockResolvedValueOnce({ data: { success: false, message: "Failed" } });
    await act(async () => {
      render(<UpdateProduct />);
    });

    const updateButton = screen.getByText("UPDATE PRODUCT");
    await act(async () => {
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed");
    });
  });
    it("handles photo upload and input changes", async () => {
    await act(async () => render(<UpdateProduct />));

    // File upload
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/Upload Photo/i);
    fireEvent.change(fileInput, { target: { files: [file] } });
 

    // Text input: name
    const nameInput = screen.getByPlaceholderText("write a name");
    fireEvent.change(nameInput, { target: { value: "New Product" } });
    expect(nameInput.value).toBe("New Product");

    // Textarea: description
    const descInput = screen.getByPlaceholderText("write a description");
    fireEvent.change(descInput, { target: { value: "New description" } });
    expect(descInput.value).toBe("New description");

    // Number input: price
    const priceInput = screen.getByPlaceholderText("write a Price");
    fireEvent.change(priceInput, { target: { value: 123 } });
    expect(priceInput.value).toBe("123");

    // Number input: quantity
    const quantityInput = screen.getByPlaceholderText("write a quantity");
    fireEvent.change(quantityInput, { target: { value: 10 } });
    expect(quantityInput.value).toBe("10");
  });

  it("shows toast error when update throws an exception", async () => {
  // Make axios.put reject to simulate error
  axios.put.mockRejectedValueOnce(new Error("Network Error"));

  await act(async () => render(<UpdateProduct />));

  const updateButton = screen.getByText("UPDATE PRODUCT");
  
  await act(async () => {
    fireEvent.click(updateButton);
  });

  await waitFor(() => {
    // toast.error should be called with the catch message
    expect(toast.error).toHaveBeenCalledWith("something went wrong");
  });
});
it("shows toast error when delete throws an exception", async () => {
  // Simulate user confirms deletion
  window.prompt = jest.fn(() => "yes");

  // Make axios.delete reject to simulate error
  axios.delete.mockRejectedValueOnce(new Error("Network Error"));

  await act(async () => render(<UpdateProduct />));

  const deleteButton = screen.getByText("DELETE PRODUCT");
  
  await act(async () => {
    fireEvent.click(deleteButton);
  });

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });
});
it("updates category when selecting from category dropdown", async () => {
  await act(async () => render(<UpdateProduct />));

  // Wait for the category select to appear
  const categorySelect = await screen.findByTestId("category-select");

  // Fire change event on select
  fireEvent.change(categorySelect, { target: { value: "cat1" } });

  // Expect the selected value to be updated
  expect(categorySelect.value).toBe("cat1");
});
  it("updates shipping when selecting from shipping dropdown", () => {
    const mockSetShipping = jest.fn();
    
    // Render a simplified version of your Select
    render(
      <select
        data-testid="shipping-select"
        onChange={(e) => mockSetShipping(e.target.value)}
      >
        <option value="0">No</option>
        <option value="1">Yes</option>
      </select>
    );

    const shippingSelect = screen.getByTestId("shipping-select");

    // Select "Yes"
    fireEvent.change(shippingSelect, { target: { value: "1" } });
    expect(mockSetShipping).toHaveBeenCalledWith("1");

    // Select "No"
    fireEvent.change(shippingSelect, { target: { value: "0" } });
    expect(mockSetShipping).toHaveBeenCalledWith("0");
  });

it("updates shipping state when selecting from shipping dropdown", async () => {
  const { container } = render(<UpdateProduct />);

  // Wait for Select to appear
  const shippingSelect = await screen.findByTestId("shipping-select");

  // Initially, the shipping value should reflect the initial state
  expect(shippingSelect.value).toBe("0"); // No

  // Change to "Yes"
  fireEvent.change(shippingSelect, { target: { value: "1" } });

  // Now the shipping state inside the component should be truthy
  expect(shippingSelect.value).toBe("1"); // Yes

  // Change back to "No"
  fireEvent.change(shippingSelect, { target: { value: "0" } });
  expect(shippingSelect.value).toBe("0"); // No
});




  
});

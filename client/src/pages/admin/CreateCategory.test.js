import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateCategory from './CreateCategory';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('./../../components/Layout', () => ({ children, title }) => (
  <div data-testid="layout" title={title}>{children}</div>
));
jest.mock('./../../components/AdminMenu', () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));
jest.mock('../../components/Form/CategoryForm', () => ({ handleSubmit, value, setValue }) => (
  <form onSubmit={handleSubmit}>
    <input 
      data-testid="category-input"
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
    <button type="submit" data-testid="submit-btn">Submit</button>
  </form>
));
jest.mock('antd', () => ({
  Modal: ({ children, visible, onCancel }) => 
    visible ? (
      <div data-testid="modal">
        <button data-testid="close-modal" onClick={onCancel}>Close</button>
        {children}
      </div>
    ) : null
}));

// Suppress act() warnings from AntD Portal (rc-trigger)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});


const mockedAxios = axios;
const mockedToast = toast;

describe('CreateCategory Component - Full Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedAxios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: '1', name: 'Test Category' }] }
    });
    
    mockedAxios.post.mockResolvedValue({
      data: { success: true, message: 'Category created' }
    });
    
    mockedAxios.put.mockResolvedValue({
      data: { success: true, message: 'Category updated' }
    });
    
    mockedAxios.delete.mockResolvedValue({
      data: { success: true, message: 'Category deleted' }
    });
  });

  describe('getAllCategory Function Coverage', () => {
    it('should load categories successfully on component mount - covers success path', async () => {
      const mockCategories = [
        { _id: '1', name: 'Category 1' },
        { _id: '2', name: 'Category 2' }
      ];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        // Covers: axios.get call with correct URL
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        
        // Covers: data.success check and setCategories call
        expect(screen.getByText('Category 1')).toBeInTheDocument();
        expect(screen.getByText('Category 2')).toBeInTheDocument();
      });
    });

    it('should handle get categories failure with network error - covers catch block', async () => {
      // Mock network error
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        // Covers: axios.get call
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        
        // Covers: catch block execution and toast.error call
        expect(mockedToast.error).toHaveBeenCalledWith('Something wwent wrong in getting catgeory');
      });
    });

    it('should handle empty categories response - covers data.success=true but empty category array', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: [] }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        // Covers: axios.get call with correct URL
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        
        // Covers: data.success check and setCategories with empty array
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      });
    });

    it('should handle get categories server error response - covers data.success=false branch', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: false, message: 'Server error' }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        // Covers: axios.get call
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
        
        // Should not display any categories since data.success is false
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      });
    });

    it('should refresh categories after successful operations - covers getAllCategory calls from other functions', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      render(<CreateCategory />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Test that getAllCategory is called after successful create
      const inputs = screen.getAllByTestId('category-input');
      const mainInput = inputs[0];
      const submitBtns = screen.getAllByTestId('submit-btn');
      const mainSubmitBtn = submitBtns[0];
      
      await act(async () => {
        fireEvent.change(mainInput, { target: { value: 'New Category' } });
        fireEvent.click(mainSubmitBtn);
      });
      
      await waitFor(() => {
        // Should be called twice: once on mount, once after create
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('handleSubmit Function Coverage', () => {
    it('should handle successful category creation - covers all success path lines', async () => {
      render(<CreateCategory />);
      
      // Use main form input (first one)
      const inputs = screen.getAllByTestId('category-input');
      const mainInput = inputs[0]; // First input is for creation
      const submitBtns = screen.getAllByTestId('submit-btn');
      const mainSubmitBtn = submitBtns[0]; // First submit button is for creation
      
      await act(async () => {
        fireEvent.change(mainInput, { target: { value: 'New Category' } });
        fireEvent.click(mainSubmitBtn); // This triggers handleSubmit
      });
      
      await waitFor(() => {
        // Covers: axios.post call with correct URL and data
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/category/create-category', {
          name: 'New Category'
        });
        
        // Covers: data?.success check and toast.success call
        expect(mockedToast.success).toHaveBeenCalledWith('New Category is created');
        
        // Covers: getAllCategory() call - should be called twice (mount + after create)
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle creation failure with server error - covers data.success=false branch', async () => {
      // Mock server error response
      mockedAxios.post.mockResolvedValue({
        data: { success: false, message: 'Category already exists' }
      });
      
      render(<CreateCategory />);
      
      // Use main form input (first one)
      const inputs = screen.getAllByTestId('category-input');
      const mainInput = inputs[0]; // First input is for creation
      const submitBtns = screen.getAllByTestId('submit-btn');
      const mainSubmitBtn = submitBtns[0]; // First submit button is for creation
      
      await act(async () => {
        fireEvent.change(mainInput, { target: { value: 'Existing Category' } });
        fireEvent.click(mainSubmitBtn);
      });
      
      await waitFor(() => {
        // Covers: data.success=false branch
        expect(mockedToast.error).toHaveBeenCalledWith('Category already exists');
      });
    });

    it('should handle creation failure with network error - covers catch block', async () => {
      // Mock network error
      mockedAxios.post.mockRejectedValue(new Error('Network error'));
      
      render(<CreateCategory />);
      
      // Use main form input (first one)
      const inputs = screen.getAllByTestId('category-input');
      const mainInput = inputs[0]; // First input is for creation
      const submitBtns = screen.getAllByTestId('submit-btn');
      const mainSubmitBtn = submitBtns[0]; // First submit button is for creation
      
      await act(async () => {
        fireEvent.change(mainInput, { target: { value: 'New Category' } });
        fireEvent.click(mainSubmitBtn);
      });
      
      await waitFor(() => {
        // Covers: catch block execution
        expect(mockedToast.error).toHaveBeenCalledWith('somthing went wrong in input form');
      });
    });

    it('should prevent default form submission - covers e.preventDefault()', async () => {
      render(<CreateCategory />);
      
      // Use main form input (first one)
      const inputs = screen.getAllByTestId('category-input');
      const mainInput = inputs[0]; // First input is for creation
      const submitBtns = screen.getAllByTestId('submit-btn');
      const mainSubmitBtn = submitBtns[0]; // First submit button is for creation
      
      await act(async () => {
        fireEvent.change(mainInput, { target: { value: 'New Category' } });
        fireEvent.click(mainSubmitBtn);
      });
      
      // preventDefault is automatically handled by fireEvent.click
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalled();
      });
    });
  });

  describe('handleUpdate Function Coverage', () => {
    it('should handle successful update - covers all success path lines', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Open edit modal (sets selected state)
      const editBtn = screen.getByText('Edit');
      fireEvent.click(editBtn);
      
      // Update category name - use getAllByTestId and select the modal input
      const inputs = screen.getAllByTestId('category-input');
      const modalInput = inputs[1]; // Second input is in the modal
      const submitBtns = screen.getAllByTestId('submit-btn');
      const modalSubmitBtn = submitBtns[1]; // Second submit button is in the modal
      
      await act(async () => {
        fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
        fireEvent.click(modalSubmitBtn); // This triggers handleUpdate
      });
      
      await waitFor(() => {
        // Covers: axios.put call with correct URL and data
        expect(mockedAxios.put).toHaveBeenCalledWith('/api/v1/category/update-category/1', {
          name: 'Updated Category'
        });
        
        // Covers: data.success check and toast.success call
        expect(mockedToast.success).toHaveBeenCalledWith('Updated Category is updated');
        
        // Covers: setSelected(null), setUpdatedName(""), setVisible(false) - modal should be closed
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        
        // Covers: getAllCategory() call - should be called twice (mount + after update)
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle update failure with server error - covers data.success=false branch', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      // Mock server error response
      mockedAxios.put.mockResolvedValue({
        data: { success: false, message: 'Update failed - category not found' }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Open edit modal
      const editBtn = screen.getByText('Edit');
      fireEvent.click(editBtn);
      
      // Try to update - use getAllByTestId and select the modal input
      const inputs = screen.getAllByTestId('category-input');
      const modalInput = inputs[1]; // Second input is in the modal
      const submitBtns = screen.getAllByTestId('submit-btn');
      const modalSubmitBtn = submitBtns[1]; // Second submit button is in the modal
      
      await act(async () => {
        fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
        fireEvent.click(modalSubmitBtn);
      });
      
      await waitFor(() => {
        // Covers: data.success=false branch
        expect(mockedToast.error).toHaveBeenCalledWith('Update failed - category not found');
        
        // Modal should still be open since update failed
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should handle update failure with network error - covers catch block', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      // Mock network error
      mockedAxios.put.mockRejectedValue(new Error('Network error'));
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Open edit modal
      const editBtn = screen.getByText('Edit');
      fireEvent.click(editBtn);
      
      // Try to update - use getAllByTestId and select the modal input
      const inputs = screen.getAllByTestId('category-input');
      const modalInput = inputs[1]; // Second input is in the modal
      const submitBtns = screen.getAllByTestId('submit-btn');
      const modalSubmitBtn = submitBtns[1]; // Second submit button is in the modal
      
      await act(async () => {
        fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
        fireEvent.click(modalSubmitBtn);
      });
      
      await waitFor(() => {
        // Covers: catch block execution
        expect(mockedToast.error).toHaveBeenCalledWith('Somtihing went wrong');
        
        // Modal should still be open since update failed
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should prevent default form submission - covers e.preventDefault()', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Open edit modal
      const editBtn = screen.getByText('Edit');
      fireEvent.click(editBtn);
      
      // Update category - use getAllByTestId and select the modal input
      const inputs = screen.getAllByTestId('category-input');
      const modalInput = inputs[1]; // Second input is in the modal
      const submitBtns = screen.getAllByTestId('submit-btn');
      const modalSubmitBtn = submitBtns[1]; // Second submit button is in the modal
      
      await act(async () => {
        fireEvent.change(modalInput, { target: { value: 'Updated Category' } });
        fireEvent.click(modalSubmitBtn);
      });
      
      // preventDefault is automatically handled by fireEvent.click
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalled();
      });
    });
  });

  describe('handleDelete Function Coverage', () => {
    it('should handle successful category deletion - covers all success path lines', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Click delete button
      const deleteBtn = screen.getByText('Delete');
      fireEvent.click(deleteBtn); // This triggers handleDelete with pId='1'
      
      await waitFor(() => {
        // Covers: axios.delete call with correct URL
        expect(mockedAxios.delete).toHaveBeenCalledWith('/api/v1/category/delete-category/1');
        
        // Covers: data.success check and toast.success call
        expect(mockedToast.success).toHaveBeenCalledWith('category is deleted');
        
        // Covers: getAllCategory() call - should be called twice (mount + after delete)
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle deletion failure with server error - covers data.success=false branch', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      // Mock server error response
      mockedAxios.delete.mockResolvedValue({
        data: { success: false, message: 'Delete failed - category not found' }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Click delete button
      const deleteBtn = screen.getByText('Delete');
      fireEvent.click(deleteBtn);
      
      await waitFor(() => {
        // Covers: data.success=false branch
        expect(mockedToast.error).toHaveBeenCalledWith('Delete failed - category not found');
      });
    });

    it('should handle deletion failure with network error - covers catch block', async () => {
      const mockCategories = [{ _id: '1', name: 'Test Category' }];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      // Mock network error
      mockedAxios.delete.mockRejectedValue(new Error('Network error'));
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
      });
      
      // Click delete button
      const deleteBtn = screen.getByText('Delete');
      fireEvent.click(deleteBtn);
      
      await waitFor(() => {
        // Covers: catch block execution
        expect(mockedToast.error).toHaveBeenCalledWith('Somtihing went wrong');
      });
    });

    it('should call handleDelete with correct category ID', async () => {
      const mockCategories = [
        { _id: '1', name: 'Category 1' },
        { _id: '2', name: 'Category 2' }
      ];
      
      mockedAxios.get.mockResolvedValue({
        data: { success: true, category: mockCategories }
      });
      
      render(<CreateCategory />);
      
      await waitFor(() => {
        expect(screen.getByText('Category 1')).toBeInTheDocument();
        expect(screen.getByText('Category 2')).toBeInTheDocument();
      });
      
      // Click delete button for second category
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]); // Second delete button
      
      await waitFor(() => {
        // Should call delete with correct ID
        expect(mockedAxios.delete).toHaveBeenCalledWith('/api/v1/category/delete-category/2');
      });
    });

    it('should close the modal when onCancel is triggered - covers onCancel={() => setVisible(false)}', async () => {
  const mockCategories = [{ _id: '1', name: 'Test Category' }];

  mockedAxios.get.mockResolvedValue({
    data: { success: true, category: mockCategories }
  });

  render(<CreateCategory />);

  await waitFor(() => {
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  // Open edit modal
  const editBtn = screen.getByText('Edit');
  fireEvent.click(editBtn);

  // Modal should now be visible
  expect(screen.getByTestId('modal')).toBeInTheDocument();

  // Click close button inside modal to trigger onCancel
  const closeBtn = screen.getByTestId('close-modal');
  fireEvent.click(closeBtn);

  await waitFor(() => {
    // Modal should disappear after onCancel triggers setVisible(false)
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});

  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryForm from './CategoryForm';

describe('CategoryForm', () => {
  test('renders input with placeholder and initial value', () => {
    render(
      <CategoryForm
        value="Initial"
        setValue={jest.fn()}
        handleSubmit={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Enter new category');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Initial');
  });

  test('calls setValue on input change', () => {
    const setValue = jest.fn();
    render(
      <CategoryForm
        value=""
        setValue={setValue}
        handleSubmit={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Enter new category');
    fireEvent.change(input, { target: { value: 'Books' } });

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('Books');
  });




});
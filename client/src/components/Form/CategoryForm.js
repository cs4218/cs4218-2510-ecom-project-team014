import React from "react";

const CategoryForm = ({ handleSubmit, value, setValue, testIdPrefix = "" }) => {
  return (
    <>
      <form onSubmit={handleSubmit} data-testid={`${testIdPrefix}-form`}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Enter new category"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid={`${testIdPrefix}-input`}
          />
        </div>

        <button type="submit" className="btn btn-primary"  data-testid={`${testIdPrefix}-submit`}>
          Submit
        </button>
      </form>
    </>
  );
};

export default CategoryForm;
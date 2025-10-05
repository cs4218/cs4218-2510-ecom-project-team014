import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";
import axios from "axios";

jest.mock("axios");

describe("useCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("successful data fetch when mount", async () => {
    const payload = [{ _id: "1", name: "Shoes", slug: "shoes" }];
    axios.get.mockResolvedValue({ data: { category: payload } });

    // simulate mounting
    const { result } = renderHook(() => useCategory());

    // check initial state
    expect(result.current).toEqual([]);

    // check successful data fetch
    await waitFor(() => {
      expect(result.current).toEqual(payload);
    });

    expect(axios.get).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });

  test("log and state stays at [] when error - e.g. API fails", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(result.current).toEqual([]);
    expect(logSpy).toHaveBeenCalled(); // no need to specify 1 time to allow flexibility for future changes in implementation
    logSpy.mockRestore();
  });

  test("guards against missing data.category (prevents undefined)", async () => {
    // Simulate backend returning undefined
    axios.get.mockResolvedValue({ data: {} });

    const { result } = renderHook(() => useCategory());

    expect(result.current).toEqual([]);
    const initialRef = result.current; // keep the array reference from render #1

    // effect started (axios called)
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    // prove a re-render happened by waiting for the reference to change
    // (setCategories always queues a render - both buggy and hardened versions are expected to change the ref)
    await waitFor(() => expect(result.current).not.toBe(initialRef));

    // post-effect values:
    // - un-hardened hook (buggy) -> undefined  (this assertion FAILS)
    // - hardened hook (hardened) -> []         (this assertion PASSES)

    expect(result.current).toEqual([]);
  });
});

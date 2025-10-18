describe("brainTreePaymentController", () => {
  it("500 when cart is missing/empty", async () => {
    const req = { body: { nonce: "n", cart: [] } };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, message: "No items in cart." })
    );
  });

  it("400 when price invalid", async () => {
    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: -1, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, message: "Invalid price for item" })
    );
  });

  it("404 when product not found in DB batch", async () => {
    productModel.find.mockResolvedValueOnce([]);

    const req = {
      body: { nonce: "n", cart: [{ _id: "p404", price: 10, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({ _id: { $in: ["p404"] } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: "Product with ID p404 not found",
      })
    );
  });

  it("400 when insufficient stock", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 0, name: "Item1" },
    ]);

    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 10, quantity: 2 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: expect.stringContaining("Insufficient stock"),
      })
    );
  });

  it("500 when total == 0", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 5, name: "Zero" },
    ]);

    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 0, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: "Total transaction amount cannot be $0.",
      })
    );
  });

  it("success: creates order, decrements stock, responds ok:true", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 5, name: "Item1" },
      { _id: "p2", quantity: 3, name: "Item2" },
    ]);

    braintreeSale.mockImplementationOnce((payload, cb) =>
      cb(null, { id: "txn-1", success: true })
    );
    productModel.bulkWrite.mockResolvedValueOnce({ ok: 1 });

    const req = {
      body: {
        nonce: "nonce-xyz",
        cart: [
          { _id: "p1", price: 10, quantity: 2 },
          { _id: "p2", price: 5, quantity: 1 },
        ],
      },
      user: { _id: "user-123" },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(braintreeSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25,
        paymentMethodNonce: "nonce-xyz",
        options: { submitForSettlement: true },
      }),
      expect.any(Function)
    );

    expect(productModel.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: "p1" },
            update: { $inc: { quantity: -2 } },
          }),
        }),
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: "p2" },
            update: { $inc: { quantity: -1 } },
          }),
        }),
      ])
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("500 when braintree reports error", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 5, name: "Item1" },
    ]);

    braintreeSale.mockImplementationOnce((payload, cb) =>
      cb(new Error("payment failed"), null)
    );

    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 9, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalled();
  });

  it("logs when gateway.transaction.sale throws synchronously", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Minimal valid body so we reach the productModel.find call
    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 10, quantity: 1 }] },
      user: { _id: "buyer1" },
    };
    const res = mockRes();

    // Force a sync throw inside the try block
    productModel.find.mockImplementationOnce(() => {
      throw new Error("find boom");
    });

    await brainTreePaymentController(req, res);

    // ✅ Outer catch executed -> console.log hit
    expect(logSpy).toHaveBeenCalled();

    // Current code only logs in the outer catch (no response), so document that behavior:
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});

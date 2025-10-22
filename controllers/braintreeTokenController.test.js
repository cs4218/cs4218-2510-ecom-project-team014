import { jest } from "@jest/globals";

jest.resetModules();

// Set dummy env values BEFORE importing the SUT so gateway picks these up
process.env.BRAINTREE_MERCHANT_ID = "mid";
process.env.BRAINTREE_PUBLIC_KEY = "pk";
process.env.BRAINTREE_PRIVATE_KEY = "sk";

await jest.unstable_mockModule("dotenv", () => ({
  default: { config: jest.fn() }, // no-op so real secrets aren't loaded
}));

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

const generateMock = jest.fn();
const BraintreeGatewayMock = jest.fn(() => ({
  clientToken: { generate: generateMock },
}));

await jest.unstable_mockModule("braintree", () => ({
  default: {
    BraintreeGateway: BraintreeGatewayMock, // used via new braintree.BraintreeGateway(...)
    Environment: { Sandbox: "Sandbox" }, // used via braintree.Environment.Sandbox
  },
}));

const { braintreeTokenController } = await import("./productController.js");

describe("braintreeTokenController (ESM-safe)", () => {
  test("calls clientToken.generate with {} and a callback; success sends response", async () => {
    const req = {};
    const res = makeRes();

    // happy path: callback returns response
    generateMock.mockImplementation((_opts, cb) => cb(null, { token: "abc" }));

    await braintreeTokenController(req, res);

    expect(generateMock).toHaveBeenCalledWith({}, expect.any(Function));
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({ token: "abc" });
  });

  test("error in generate callback: responds 500 with error", async () => {
    const req = {};
    const res = makeRes();
    const err = new Error("gateway down");

    generateMock.mockImplementation((_opts, cb) => cb(err, undefined));

    await braintreeTokenController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(err);
  });

  test("sync throw inside generate: outer catch logs and sends no response (current behavior)", async () => {
    const req = {};
    const res = makeRes();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // simulate a synchronous throw from gateway call
    generateMock.mockImplementation(() => {
      throw new Error("sync boom");
    });

    await braintreeTokenController(req, res);

    expect(logSpy).toHaveBeenCalled(); // logged
    expect(res.status).not.toHaveBeenCalled(); // no response
    expect(res.send).not.toHaveBeenCalled();
  });

  test("constructs gateway with env vars", async () => {
    // The module was imported once; verify constructor args
    expect(BraintreeGatewayMock).toHaveBeenCalledWith({
      environment: "Sandbox",
      merchantId: "mid",
      publicKey: "pk",
      privateKey: "sk",
    });
  });
});

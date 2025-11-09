import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //alidation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = new productModel({ ...req.fields, name: String(name), description: String(description), price: Number(price), category: String(category), quantity: Number(quantity),slug: slugify(name) });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in crearing product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "AllProducts ",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};
// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getitng single product",
      error,
    });
  }
};

export const productPhotoController = async (req, res) => {
  try {
    const { pid } = req.params;
    if (!pid) {
      return res
        .status(400)
        .send({ success: false, message: "Missing product id (pid)" });
    }

    const product = await productModel.findById(pid).select("photo");
    if (!product || !product.photo || !product.photo.data) {
      return res
        .status(404)
        .send({ success: false, message: "Photo not found for product" });
    }

    res.set(
      "Content-Type",
      product.photo.contentType || "application/octet-stream"
    );
    return res.status(200).send(product.photo.data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error: error?.message ?? String(error),
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//upate product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //alidation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Update product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    // only this line is new to handle undefined filter input
    const { checked = [], radio = [] } = req.body || {};

    let args = {};
    if (checked.length > 0) args.category = checked; // keep original semantics
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

    const products = await productModel.find(args);
    return res.status(200).send({ success: true, products });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// productListController (hardened minimally)
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const raw = req.params?.page;
    let page = Number.parseInt(raw, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;

    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage) // now always 0, 6, 12, ...
      .limit(perPage)
      .sort({ createdAt: -1 });

    return res.status(200).send({ success: true, products });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword || !keyword.trim()) {
      return res.json([]);
    }
    const trimmedKeyword = keyword.trim();
    // escape regex wildcards
    const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const resutls = await productModel
      .find({
        $or: [
          { name: { $regex: escapedKeyword, $options: "i" } },
          { description: { $regex: escapedKeyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(resutls);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while geting related product",
      error,
    });
  }
};

// get prdocyst by catgory
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error While Getting products",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    if (!cart || cart.length === 0) {
      return res.status(400).send({ok: false, message: "No items in cart."})
    }

    // Batch query to fetch all products from DB at once
    const productIds = cart.map((item) => item._id);
    const products = await productModel.find({ _id: { $in: productIds } });

    // Create a map for quick lookups
    const productMap = new Map();
    products.forEach((product) => {
      productMap.set(product._id.toString(), product);
    });

    // Validate all items against the fetched products and calculate total using DB prices
    let total = 0;
    const validatedCart = [];

    for (const item of cart) {
      const product = productMap.get(item._id.toString());

      if (!product) {
        return res.status(404).send({
          ok: false,
          message: `Product with ID ${item._id} not found`,
        });
      }

      // Validate price from database (security fix)
      if (product.price < 0 || Number.isNaN(Number(product.price))) {
        return res.status(400).send({ok: false, message: `Invalid price for product ${product.name}`})
      }

      // CRITICAL SECURITY: Reject if client-provided price doesn't match DB price
      // Note: This makes price optional in the cart, but we want to enforce the client
      // to include it so that there is never any confusion about the total price between client and our DB source of truth.
      if (item.price !== undefined && item.price !== product.price) {
        return res.status(400).send({
          ok: false,
          message: `Price mismatch for product ${product.name}. Expected: ${product.price}, Received: ${item.price}`
        })
      }

      // Check if requested quantity is available
      const requestedQuantity = item.quantity || 1;
      if (!product.quantity || product.quantity < requestedQuantity) {
        return res.status(400).send({
          ok: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${requestedQuantity}`,
        });
      }

      // CRITICAL FIX: use the price from DB, not the client-provided cart
      total += product.price * requestedQuantity;

      validatedCart.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: requestedQuantity
      });
    }

    // We assume that $0 transactions (e.g. discounts, free items etc.) are not allowed at the moment
    if (total === 0) {
      return res.status(400).json({ok: false, message: "Total transaction amount cannot be $0."})
    }

    gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      async function (error, result) {
        if (result) {
          try {
            // FIX: Await order creation to avoid race conditions
            const order = await new orderModel({
              products: validatedCart.map(item => item.product),
              payment: result,
              buyer: req.user._id,
            }).save();

            // decrement inventory (in bulk, to avoid mongo N+1 query)
            const bulkOps = validatedCart.map(item => ({
              updateOne: {
                filter: { _id: item.product },
                update: { $inc: { quantity: -item.quantity } }
              }
            }));

            await productModel.bulkWrite(bulkOps);

            res.json({ ok: true });
          } catch (dbError) {
            console.log('Database error after payment:', dbError);
            // payment succeeded but database operation failed
            // needs manual intervention (out of scope of the app, as payment has already been processed)
            res.status(500).send({ok: false, message: "Payment processed but order recording failed. Please contact support."});
          }
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send({ok: false, message: "An error occurred processing your payment."});
  }
};

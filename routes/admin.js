const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../models/products");
const passport = require("passport");
const Order = require("../models/orders");
const isAdmin = require("../lib/authMiddleware.cjs");
const fs = require("fs");
const path = require("path");
const { deleteFileFromBucket } = require("../lib/googleStorage");

router.get(
  "/api/verifyAdmin",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  (req, res, next) => {
    res.status(200).json({
      success: true,
      msg: "You are successfully authenticated to this route!",
    });
  }
);

router.get("/api/monthly-revenues", async (req, res) => {
  try {
    const year = new Date().getFullYear(); // Get the current year
    const monthlyRevenue = await Order.aggregate([
      // Match orders by the current year and exclude cancelled orders
      {
        $match: {
          paymentDate: {
            $gte: new Date(`${year}-01-01`), // Start of the year
            $lt: new Date(`${year + 1}-01-01`), // End of the year
          },
          status: { $ne: "cancelled" }, // Exclude cancelled orders
        },
      },
      // Unwind the cart array to treat each cart item individually
      { $unwind: "$cart" },
      // Group by month and sum up the total price for each cart item
      {
        $group: {
          _id: { $month: "$paymentDate" }, // Group by month
          totalRevenue: {
            $sum: { $multiply: ["$cart.price", "$cart.quantity"] },
          }, // Sum the price * quantity for each item
        },
      },
      // Sort by month to ensure the order is correct
      { $sort: { _id: 1 } },
    ]);

    // Create an array of 12 elements (months) initialized to 0
    const revenueArray = Array(12).fill(0);

    // Map the monthly revenue results to the corresponding month in the array
    monthlyRevenue.forEach((item) => {
      revenueArray[item._id - 1] = item.totalRevenue; // Subtract 1 to align with zero-indexed months
    });

    res.status(200).json(revenueArray);
  } catch (error) {
    console.error("Error fetching monthly revenues:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
//----Handling Saving Products----

router.post(
  "/api/addProduct",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    console.log(req.body);
    try {
      const product = new Product({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        delivery: req.body.delivery,
        stock: req.body.stock,
        category: req.body.category,
        productDetails: req.body.productDetails,
        specification: req.body.specification,
        materials: req.body.materials,
        tags: req.body.tags,
        productThumbnail: req.body.productThumbnail,
        additionalImages: req.body.additionalImages,
      });

      const savedProduct = await product.save();

      res
        .status(201)
        .send({ message: "Product added successfully", product: savedProduct });
    } catch (error) {
      console.error("Failed to add product:", error);
      res
        .status(400)
        .json({ message: "Failed to add product", error: error.message });
    }
  }
);

router.post(
  "/api/updateProduct/:id",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    console.log(req.body);
    try {
      const {
        name,
        price,
        description,
        delivery,
        stock,
        category,
        productDetails,
        productThumbnail,
        additionalImages,
      } = req.body;
      if (!name || !price || !description) {
        return res
          .status(400)
          .json({ success: false, msg: "Missing required fields" });
      }

      // Prepare the product object, safely parsing JSON fields
      const product = {
        name,
        price,
        description,
        delivery,
        stock,
        category,
        productDetails,
        specification: tryParseJSON(req.body.specification),
        materials: tryParseJSON(req.body.materials),
        tags: tryParseJSON(req.body.tags),
        productThumbnail,
        additionalImages,
      };

      // Use findOneAndReplace to update the product
      const data = await Product.findOneAndReplace(
        { _id: req.params.id },
        product,
        { new: true }
      );
      if (!data) {
        return res
          .status(404)
          .json({ success: false, msg: "Product not found" });
      }

      // Respond with success
      res.status(200).json({
        success: true,
        msg: "Product updated successfully",
      });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ success: false, msg: "Failed to update product" });
    }
  }
);

router.delete("/api/deleteProduct/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    // Delete additional images
    deletedProduct.additionalImages &&
      deletedProduct.additionalImages.forEach((image) => {
        const fileName = image.split(`${process.env.BUCKET_NAME}/`)[1];
        deleteFileFromBucket(fileName);
      });

    // Delete thumbnail
    const fileName = deletedProduct.productThumbnail.split(
      `${process.env.BUCKET_NAME}/`
    )[1];
    deleteFileFromBucket(fileName);

    res
      .status(200)
      .json({ success: true, msg: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, msg: "Failed to delete product" });
  }
});

function tryParseJSON(jsonString) {
  let parsedData =
    typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
  return parsedData;
}

router.post(
  "/api/setPromo",
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  async (req, res) => {
    const {
      option,
      itemsWithDiscount,
      discountForAll,
      promoType,
      buyQuantity,
    } = req.body;

    // Validate input
    if (
      !option ||
      (option === "specific" && !Array.isArray(itemsWithDiscount)) ||
      (option === "all" && !discountForAll && promoType === "percentage") ||
      (promoType === "buyXget1" && !buyQuantity)
    ) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    try {
      if (option === "all") {
        const products = await Product.find({});
        await Promise.all(
          products.map(async (product) => {
            product.promo = {
              promotionType: promoType,
              ...(promoType === "percentage"
                ? {
                    discountDetails: {
                      percentageDiscount: { amount: discountForAll },
                    },
                  }
                : {
                    discountDetails: {
                      buyXGet1Discount: { buyQuantity: buyQuantity },
                    },
                  }),
            };
            await product.save().catch((error) => {
              console.error(
                `Error saving product ID ${product._id}:`,
                error.message
              );
              throw new Error(
                `Failed to set promo for product ID ${product._id}`
              );
            });
          })
        );
      } else if (option === "specific") {
        await Promise.all(
          itemsWithDiscount.map(async (item) => {
            try {
              const product = await Product.findById(item.product);
              if (!product) {
                throw new Error(`Product with ID ${item.product} not found`);
              }

              product.promo = {
                promotionType: item.type,
                ...(item.type === "percentage"
                  ? {
                      discountDetails: {
                        percentageDiscount: { amount: item.discount },
                      },
                    }
                  : {
                      discountDetails: {
                        buyXGet1Discount: { buyQuantity: item.discount },
                      },
                    }),
              };
              await product.save().catch((error) => {
                console.error(
                  `Error saving product ID ${product._id}:`,
                  error.message
                );
                throw new Error(
                  `Failed to set promo for product ID ${product._id}`
                );
              });
            } catch (error) {
              console.error(
                `Error processing item with product ID ${item.product}:`,
                error.message
              );
              throw error;
            }
          })
        );
      }

      res.status(200).json({ message: "Promo set successfully" });
    } catch (error) {
      console.error("Error setting promo:", error.message);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

module.exports = router;

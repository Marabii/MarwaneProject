const express = require("express");
const router = express.Router();
const passport = require("passport");
const Order = require("../models/orders");
const Product = require("../models/products");
const sendEmail = require("../lib/email");

router.get(
  "/api/getRecentOrder",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Find the most recent order by this user and sort by 'createdAt' in descending order
      let recentOrder;
      try {
        recentOrder = await Order.findOne({ userId: req.user._id })
          .sort({ createdAt: -1 })
          .select("createdAt isSuccessfulPageSeen")
          .limit(1);
      } catch (error) {
        console.error("Error fetching recent order:", error);
        return res.status(500).send("Internal server error");
      }
      if (!recentOrder) {
        console.log("No recent order found for user:", req.user._id);
        return res.status(404).send("No orders found for this user");
      }

      // Check if an order was found
      if (recentOrder) {
        res.status(200).json(recentOrder);
      } else {
        res.status(404).send("No orders found for this user");
      }
    } catch (e) {
      // Handle potential errors in querying the database
      res.status(500).send("Error fetching order");
    }
  }
);

router.get(
  "/api/getOrdersData",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const userId = req.user._id;
    try {
      const order = await Order.find({ userId });
      if (!order) {
        return res.status(404).send("No orders found for this user");
      }
      res.status(200).json(order);
    } catch (e) {
      console.error("getOrdersData error: ", e);
      res.status(500).send("Internal server error");
    }
  }
);

router.get(
  "/api/getOrder/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const orderConfirmationNumber = req.params.id;
    try {
      const order = await Order.findOne({ orderConfirmationNumber });

      if (!order) {
        return res.status(404).send("Order not found");
      }

      if (order.userId != req.user._id) {
        console.log("Order found, but not for the logged in user");
        return res.status(401).send("Unauthorized");
      }

      res.status(200).json(order);
    } catch (e) {
      console.error("getOrder error: ", e);
      res.status(500).send("Internal server error");
    }
  }
);

router.get(
  "/api/getRecentOrder",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      // Find the most recent order by this user and sort by 'createdAt' in descending order
      let recentOrder;
      try {
        recentOrder = await Order.findOne({ userId: req.user._id })
          .sort({ createdAt: -1 })
          .select("createdAt isSuccessfulPageSeen")
          .limit(1);
      } catch (error) {
        console.error("Error fetching recent order:", error);
        return res.status(500).send("Internal server error");
      }
      if (!recentOrder) {
        console.log("No recent order found for user:", req.user._id);
        return res.status(404).send("No orders found for this user");
      }

      // Check if an order was found
      if (recentOrder) {
        res.status(200).json(recentOrder);
      } else {
        res.status(404).send("No orders found for this user");
      }
    } catch (e) {
      // Handle potential errors in querying the database
      res.status(500).send("Error fetching order");
    }
  }
);

router.post("/api/accept-order", async (req, res) => {
  try {
    const { fullName, phoneNumber, country, cartItems, address, email } =
      req.body;

    // Validate request body
    if (!fullName || !phoneNumber || !country || !cartItems || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch and process cart items in parallel
    const cart = await Promise.all(
      cartItems.map(async (item) => {
        const cartItemId = item.productId;
        const product = await Product.findById(cartItemId);

        if (!product) {
          throw new Error(`Product with ID ${cartItemId} not found`);
        }

        const returnObject = {
          productId: cartItemId,
          quantity: item.quantity,
          price: product.price,
        };

        // Apply promotion if applicable
        if (product.promo && product.promo.promotionType === "buyXget1") {
          returnObject.bonus = Math.floor(
            item.quantity /
              product.promo.discountDetails.buyXGet1Discount.buyQuantity
          );
        }

        return returnObject;
      })
    );

    // Calculate total amount
    const totalAmount = cart.reduce(
      (acc, currItem) => acc + currItem.price * currItem.quantity,
      0
    );

    // Create new order
    const order = new Order({
      cart,
      address,
      totalAmount,
      fullName,
      phoneNumber,
      country,
      email,
    });

    // Save order to database
    await order.save();
    sendEmail(
      email,
      "Order confirmation",
      "We are happy to tell you that we have received your order and it is currently under processing"
    );
    // Send success response
    return res
      .status(201)
      .json({ message: "Order accepted successfully", orderId: order._id });
  } catch (error) {
    console.error("Error processing order:", error);
    return res
      .status(500)
      .json({ error: "Failed to accept order", details: error.message });
  }
});

module.exports = router;

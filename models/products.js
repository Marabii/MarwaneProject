const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const promoSchema = {
  promotionType: {
    type: String,
    enum: ["percentage", "buyXget1"],
    required: true,
  },
  discountDetails: {
    percentageDiscount: {
      amount: {
        type: Number,
        default: 0,
        min: [0, "Percentage discount cannot be negative"],
        max: [80, "Percentage discount cannot exceed 80%"],
        required: function () {
          return this.promotionType === "percentage";
        },
      },
    },
    buyXGet1Discount: {
      buyQuantity: {
        type: Number,
        min: [1, "You must buy at least one item"],
        required: function () {
          return this.promotionType === "buyXget1";
        },
      },
    },
  },
};

// Main Product schema
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    minLength: [5, "Product name cannot be less than 5 characters long"],
    maxLength: [20, "Product name cannot exceed 20 characters"],
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Product price cannot be negative"],
  },
  description: {
    type: String,
    trim: true,
  },
  delivery: {
    type: String,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"],
    default: 0,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  productDetails: {
    type: String,
    trim: true,
  },
  materials: {
    type: [String], // Array of Strings
    default: [],
  },
  tags: {
    type: [String], // Array of Strings
    default: [],
  },
  specification: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  objectID: {
    type: String,
    required: false,
  },
  promo: { type: promoSchema, required: false },
  productThumbnail: { type: String, required: true },
  additionalImages: { type: [String], required: false },
  numberOfOrders: {
    type: Number,
    min: [0, "Number of Orders cannot be negative"],
    default: 0,
  },
});

// Pre-save hook to ensure objectID is set to _id
ProductSchema.pre("save", function (next) {
  if (!this.objectID) {
    this.objectID = this._id.toString(); // Convert MongoDB ObjectId to string
  }
  next();
});

const Product = mongoose.model("Product", ProductSchema);

// Expose the model
module.exports = Product;

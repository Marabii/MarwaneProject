const fs = require("fs");
const path = require("path");

// Load the products JSON file
const filePath = path.join(__dirname, "ThirdEcommerceWebsite.products.json"); // Update the path to your JSON file

// Read the products from the file
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  let products = JSON.parse(data);

  // Function to generate a random promotion
  const generateRandomPromo = () => {
    // 50% chance to have a promo, 50% chance to not
    if (Math.random() > 0.5) {
      return null;
    }

    // Randomly decide the promotion type
    const promotionType = Math.random() > 0.5 ? "percentage" : "buyXget1";

    if (promotionType === "percentage") {
      return {
        promotionType: "percentage",
        discountDetails: {
          percentageDiscount: {
            amount: Math.floor(Math.random() * 81), // Random percentage between 0 and 80
          },
        },
      };
    } else {
      // Random Buy X Get Y discount
      const buyQuantity = Math.floor(Math.random() * 2) + 1; // Random buy amount between 1 and 5

      return {
        promotionType: "buyXget1",
        discountDetails: {
          buyXGet1Discount: {
            buyQuantity,
          },
        },
      };
    }
  };

  // Add promo to each product
  products = products.map((product) => {
    product.promo = generateRandomPromo(); // Add promo field to product
    return product;
  });

  // Write the updated products back to the file
  fs.writeFile(filePath, JSON.stringify(products, null, 2), (err) => {
    if (err) {
      console.error("Error writing the file:", err);
      return;
    }
    console.log("Promo field added to products successfully!");
  });
});

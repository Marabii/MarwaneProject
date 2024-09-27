require("dotenv").config();
const sendEmail = require("./lib/email");

const replacements = {
  "Customer Name": "John Doe",
  "Product Name": "Sofa",
  "Order Number": "123456",
  "Estimated Delivery Date": "October 10, 2024",
  "Company Name": "Furniture Co.",
};

sendEmail("minehamza90@gmail.com", "Your Order Confirmation", replacements);

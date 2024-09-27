const router = require("express").Router();

//--Routes--:

// const fetchApis = require("./fetch_apis");
const users = require("./users");
const admin = require("./admin");
const orders = require("./orders");
const products = require("./products");
const googleStorage = require("./googleStorage");
const googleOAuth = require("./googleOAuth");

// router.use(fetchApis);
router.use(users);
router.use(admin);
router.use(orders);
router.use(products);
router.use(googleStorage);
router.use(googleOAuth);

module.exports = router;

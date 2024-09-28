const express = require("express");
const router = express.Router();
const {
  uploadToFirebaseStorage,
  deleteFileFromBucket,
} = require("../lib/googleStorage");
const passport = require("passport");

router.post(
  "/api/upload/:dest",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const dest = req.params.dest;
    if (dest !== "additionalImages" && dest !== "products")
      return res.status(400).json({
        msg: "dest parameter can only be 'additionalImages or products",
      });
    uploadToFirebaseStorage(req, res, dest);
  }
);

router.delete(
  "/api/deleteItem",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const fileName = req.body.fileName;
    if (!fileName) return res.status(400).json({ msg: "fileName is required" });
    try {
      await deleteFileFromBucket(fileName);
      return res.json({ msg: "item deleted successfully" });
    } catch (e) {
      res.status(500).json({ msg: "something went wrong" });
    }
  }
);

module.exports = router;

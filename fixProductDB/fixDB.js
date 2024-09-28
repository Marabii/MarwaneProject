const fs = require("fs");
const path = require("path");

// Step 1: Read the JSON file
fs.readFile(
  path.join(__dirname, "ThirdEcommerceWebsite.products.json"),
  "utf8",
  (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    try {
      // Step 2: Parse the JSON data into an array of objects
      const jsonArray = JSON.parse(data);

      // Step 3: Iterate through each object and add the objectID field
      const updatedArray = jsonArray.map((obj) => {
        // Check if the _id.$oid field exists before assigning the objectID
        if (obj._id && obj._id.$oid) {
          obj.objectID = obj._id.$oid;
        }
        return obj;
      });

      // Step 4: Convert the updated array back to JSON
      const updatedJson = JSON.stringify(updatedArray, null, 2);

      // Step 5: Write the updated JSON to a new file
      fs.writeFile("output.json", updatedJson, "utf8", (err) => {
        if (err) {
          console.error("Error writing the file:", err);
          return;
        }
        console.log(
          "Successfully added objectID to each object and wrote to output.json"
        );
      });
    } catch (parseError) {
      console.error("Error parsing the JSON data:", parseError);
    }
  }
);

const express = require("express");
require("dotenv").config();

//const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const mongoose = require("./models/db");

// change ##########################
app.use(cors({
  origin: "*"
}));


const port = process.env.PORT || 3000;

// Middleware to automatically parse incoming JSON requests and make it available in req.body
// used when u want to give input in json
app.use(express.json());


const userrouter = require("./routes/user");
const courserouter = require("./routes/courses");
const adminrouter = require("./routes/admin");
app.get("/", (req, res) => {
    res.send("Edustack Backend is running ");
  });
  

app.use("/user", userrouter);
app.use("/courses", courserouter);
app.use("/admin", adminrouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


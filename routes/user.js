const express = require("express");

const userrouter = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const z = require("zod");
const {userModel} = require("../models/db");
const { userMiddleware } = require("../middleware/user");
const {JWT_USER_PASSWORD} = require("../config");
const {courseModel} = require("../models/db");
const {purchaseModel} = require("../models/db");


// Zod --> It checks if the data you receive (from API, forms, DB, etc.) matches the rules you define.
// If not, it throws a clear error.

userrouter.post("/signup", async(req,res)=>{

    //input validation using zod 
    const requiredBody = z.object({
        email: z.string().min(3).max(100),
        password: z.string().min(3).max(100),
        firstName: z.string().min(3).max(30),
        lastName: z.string().min(3).max(30),
    });

     // safeParse checks if req.body matches your Zod schema (requiredBody).
    // "safe" parsing (doesn't throw error if validation fails)
    const parsedDataSuccess = requiredBody.safeParse(req.body);         

    //If data is not correct then yeh response return kr do
    if(!parsedDataSuccess.success){                     
        return res.json({
            message: "Incorrect Format",
            error: parsedDataSuccess.error
        })
    }

    const {email, password, firstName, lastName} = req.body;

    //protecting user passwords before storing them in your database by hashing with bcrypt.
    // Hash the user's password using bcrypt with a salt rounds of 5
const hashedpassword = await bcrypt.hash(password,5);

try{
     // Create a new user entry with the provided email, hashed password, firstName, lastName
     await userModel.create({
        email : email,
        password : hashedpassword,
        firstName : firstName,
        lastName : lastName
     });
} catch(e){
    // If there is an error during user creation, return a error message
    return res.status(400).json({
        // Provide a message indicating signup failure
        message: "You are already signup",
    });
}

    res.json({
        message : "signup succesfully"
    })
    
});





userrouter.post("/signin",  async function (req,res) {

    // Define the schema for validating the request body data using zod
    const requireBody = z.object({

        // Email must be a valid email format
        email: z.string().email(),

        // Password must be at least 6 character
        password: z.string().min(6)
    });
    // Parse adnd validate the incomng request body data
    const parsedDataWithSuccess = requireBody.safeParse(req.body);

    // If validation fails, return a error with the validation error details
    if(!parsedDataWithSuccess.success){
        return res.json({
            message: "Incorrect Data Fotrmat",
            error: parsedDataWithSuccess.error,
        });
    };

    const {email, password} = req.body;

    const user = await userModel.findOne({
        email : email,

    });
    
    if(!user){
        return res.status(403).json({
            message : "incorrect info"
        })
    }


    
    const passwordMatch = await bcrypt.compare(password, user.password);

    // If the password matches, create a jwt token and send it to the client
    if(passwordMatch){

        // Create a jwt token using the jwt.sign() method
        const token = jwt.sign({
            id: user._id
        }, JWT_USER_PASSWORD);

        // Send the generated token back to client
        res.json({
            token:token,
        });

    }else{
        // If the password does not match, return a error indicating the invalid credentials
        res.status(403).json({
            // Error message for failed password comparison
            message:"Invalid credentials!"
        })
    }

//    ***---*** bcrypt.compare → checks if password is correct.

// jwt.sign → creates a secure token for the user.

// res.json({ token }) → gives client a token to use for future authenticated requests.
});




//PURCHASE COURSE (JWT REQUIRED)
userrouter.post("/purchase", userMiddleware, async (req, res) => {

    const requiredBody = z.object({
        courseId: z.string().min(1)
    });

    const parsed = requiredBody.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            message: "Incorrect Format",
            error: parsed.error
        });
    }

    const { courseId } = req.body;
    const userId = req.userId;

    const course = await courseModel.findById(courseId);

    if (!course) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    const alreadyPurchased = await purchaseModel.findOne({ userId, courseId });

    if (alreadyPurchased) {
        return res.status(400).json({
            message: "Already purchased"
        });
    }

    await purchaseModel.create({
        userId,
        courseId
    });

    res.json({
        message: "Course purchased successfully!"
    });

});

// GET PURCHASED COURSES (JWT REQUIRED)
// ----------------------------
userrouter.get("/purchases", userMiddleware, async function (req, res) {

    const userId = req.userId;

    const purchases = await purchaseModel.find({ userId });

    const courseIds = purchases.map(p => p.courseId);

    const courses = await courseModel.find({
        _id: { $in: courseIds }
    });

    res.json({
        message: "your purchases",
        courses: courses
    });

});

// ---------------------------------------------------
// UNPURCHASE / REMOVE COURSE (JWT REQUIRED)
// User apne My Courses se course hata sakta hai
// ---------------------------------------------------
userrouter.delete("/purchase/:courseId", userMiddleware, async (req, res) => {

    const userId = req.userId;              // Logged-in user
    const courseId = req.params.courseId;  // Course to remove

    // Check if purchase exists
    const purchase = await purchaseModel.findOne({ userId, courseId });

    if (!purchase) {
        return res.status(404).json({
            message: "Course not purchased"
        });
    }

    // Delete purchase record (UNPURCHASE)
    await purchaseModel.deleteOne({ userId, courseId });

    res.json({
        message: "Course removed from My Courses"
    });
});


userrouter.get("/profile", userMiddleware, async (req, res) => {
    const user = await userModel
        .findById(req.userId)
        .select("firstName lastName email");

    res.json({
        success: true,
        user
    });
});






module.exports = userrouter;
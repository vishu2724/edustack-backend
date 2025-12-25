const express = require("express");
const adminrouter = express.Router();
const {adminModel, courseModel} = require("../models/db")

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const z = require("zod");
const {userModel} = require("../models/db");

const {JWT_ADMIN_PASSWORD} = require("../config");

const {adminMiddleware} = require("../middleware/admin");


// Zod --> It checks if the data you receive (from API, forms, DB, etc.) matches the rules you define.
// If not, it throws a clear error.


adminrouter.post("/signup", async(req,res)=>{
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
        await adminModel.create({
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

adminrouter.post("/signin", async function (req,res) {
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
   
       const user = await adminModel.findOne({
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
           }, JWT_ADMIN_PASSWORD);
   
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

adminrouter.post("/course", adminMiddleware, async function (req,res) {

    const adminId = req.adminId;
 
    const requiredBody = z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        imageUrl: z.string(),
        price: z.number().positive(),
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

       const {title, description, imageUrl, price} = req.body;

       const course = await courseModel.create({
        title : title,
        description : description,
        imageUrl : imageUrl,
        creatorId : adminId,
        price : price
       })

       res.status(201).json({
        message: "Course Created",
        courseId: course._id,
    });

    
});


    
adminrouter.put("/course", adminMiddleware, async function (req, res) {
    const adminId = req.adminId;
    const courseId = req.body.courseId;

    // Zod Schema (all fields optional for update)
    const requiredBody = z.object({
        title: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        imageUrl: z.string().url().optional(),
        price: z.number().positive().optional(),
        courseId: z.string().min(1) // courseId must be required
    });

    const parsedData = requiredBody.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "Incorrect Format",
            error: parsedData.error
        });
    }

    // Fetch existing course
    const existingCourse = await courseModel.findOne({
        _id: courseId,
        creatorId: adminId
    });

    if (!existingCourse) {
        return res.status(404).json({
            message: "Course not found or unauthorized"
        });
    }

    // Merge new fields with old values
    const updatedData = {
        title: req.body.title ?? existingCourse.title,
        description: req.body.description ?? existingCourse.description,
        imageUrl: req.body.imageUrl ?? existingCourse.imageUrl,
        price: req.body.price ?? existingCourse.price
    };

    // Update the course
    await courseModel.updateOne({ _id: courseId }, updatedData);

    res.status(200).json({
        message: "Course updated successfully",
        courseId: courseId,
    });
});


adminrouter.get("/course/bulk", adminMiddleware, async function (req,res) {
     // Get the adminId from the request object
     const adminId = req.adminId;

     // Find all the courses with given creatorId
     const courses = await courseModel.find({
         creatorId: adminId,
     });
 
     // Respond with the courses if they are found successfully
     res.json({
         message: "courses are shown",
         courses: courses,
     });
    
});

adminrouter.delete("/course/:id", adminMiddleware, async (req, res) => {
    try {
        const adminId = req.adminId;
        const courseId = req.params.id;

        const course = await courseModel.findOne({
            _id: courseId,
            creatorId: adminId
        });

        if (!course) {
            return res.status(404).json({
                message: "Course not found or unauthorized"
            });
        }

        await courseModel.deleteOne({ _id: courseId });

        res.json({
            success: true,
            message: "Course deleted successfully"
        });

    } catch (error) {
        console.log("Delete error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});


module.exports = adminrouter;
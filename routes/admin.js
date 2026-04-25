const express = require("express");
const adminrouter = express.Router();
const {adminModel, courseModel} = require("../models/db")
const { moduleModel } = require("../models/db");
const { lectureModel } = require("../models/db");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const z = require("zod");
const {userModel} = require("../models/db");

const {JWT_ADMIN_PASSWORD} = require("../config");

const {adminMiddleware} = require("../middleware/admin");


// Zod --> It checks if the data you receive (from API, forms, DB, etc.) matches the rules you define.
// If not, it throws a clear error.


adminrouter.post("/signup", async (req, res) => {

    const requiredBody = z.object({
        email: z.string().email(),
        password: z.string().min(6).max(100),
        firstName: z.string().min(3).max(30),
        lastName: z.string().min(3).max(30),
    });

    const parsedDataSuccess = requiredBody.safeParse(req.body);

    if (!parsedDataSuccess.success) {
        return res.status(400).json({
            message: "Incorrect Format",
            error: parsedDataSuccess.error
        });
    }

    const { email, password, firstName, lastName } = req.body;

    try {
        const hashedpassword = await bcrypt.hash(password, 10); 

        await adminModel.create({
            email,
            password: hashedpassword,
            firstName,
            lastName
        });

        res.json({
            message: "Signup successful"
        });

    } catch (e) {
        console.log(e); 
        return res.status(400).json({
            message: "Signup failed (maybe email already exists)"
        });
    }
});

adminrouter.post("/signin", async function (req,res) {
   // Define the schema for validating the request body data using zod
       const requireBody = z.object({
   
           // Email must be a valid email format
           email: z.string().email(),
   
           // Password must be at least 6 character
           password: z.string().min(6).max(100),
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
   
       const admin = await adminModel.findOne({
           email : email,
   
       });
       
       if(!admin){
           return res.status(403).json({
               message : "incorrect info"
           })
       }
   
   
       
       const passwordMatch = await bcrypt.compare(password, admin.password);
   
       // If the password matches, create a jwt token and send it to the client
       if(passwordMatch){
   
           // Create a jwt token using the jwt.sign() method
           const token = jwt.sign({
               id: admin._id
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


adminrouter.put("/module", adminMiddleware, async (req, res) => {
    const { moduleId, title } = req.body;

    if (!moduleId) {
        return res.status(400).json({
            message: "moduleId required"
        });
    }

    const updated = await moduleModel.findByIdAndUpdate(
        moduleId,
        { title },
        { new: true }
    );

    res.json({
        message: "Module updated",
        module: updated
    });
});

adminrouter.put("/lecture", adminMiddleware, async (req, res) => {
    const { lectureId, title, videoUrl } = req.body;

    if (!lectureId) {
        return res.status(400).json({
            message: "lectureId required"
        });
    }

    const updated = await lectureModel.findByIdAndUpdate(
        lectureId,
        { title, videoUrl },
        { new: true }
    );

    res.json({
        message: "Lecture updated",
        lecture: updated
    });
});

adminrouter.put("/course/:id/full", adminMiddleware, async (req, res) => {
    try {
        const adminId = req.adminId;
        const courseId = req.params.id;
        const { title, description, imageUrl, price, modules = [] } = req.body;

        if (!courseId) {
            return res.status(400).json({ message: "courseId is required" });
        }

        const course = await courseModel.findOne({
            _id: courseId,
            creatorId: adminId
        });

        if (!course) {
            return res.status(404).json({
                message: "Course not found or unauthorized"
            });
        }

        await courseModel.updateOne(
            { _id: courseId },
            {
                title,
                description,
                imageUrl,
                price
            }
        );

        const existingModules = await moduleModel.find({ courseId });
        const existingModuleIds = new Set(existingModules.map((mod) => String(mod._id)));
        const incomingModuleIds = new Set(
            modules
                .filter((mod) => mod?._id)
                .map((mod) => String(mod._id))
        );

        const moduleIdsToDelete = existingModules
            .filter((mod) => !incomingModuleIds.has(String(mod._id)))
            .map((mod) => mod._id);

        if (moduleIdsToDelete.length > 0) {
            await lectureModel.deleteMany({ moduleId: { $in: moduleIdsToDelete } });
            await moduleModel.deleteMany({ _id: { $in: moduleIdsToDelete } });
        }

        for (let i = 0; i < modules.length; i++) {
            const incomingModule = modules[i];
            const moduleTitle = incomingModule.moduleTitle ?? incomingModule.title ?? "";
            let currentModuleId = incomingModule._id;

            if (currentModuleId && existingModuleIds.has(String(currentModuleId))) {
                await moduleModel.updateOne(
                    { _id: currentModuleId, courseId },
                    { title: moduleTitle, orderIndex: i + 1 }
                );
            } else {
                const createdModule = await moduleModel.create({
                    courseId,
                    title: moduleTitle,
                    orderIndex: i + 1
                });
                currentModuleId = createdModule._id;
            }

            const lectures = Array.isArray(incomingModule.lectures) ? incomingModule.lectures : [];
            const existingLectures = await lectureModel.find({ moduleId: currentModuleId });
            const existingLectureIds = new Set(existingLectures.map((lec) => String(lec._id)));
            const incomingLectureIds = new Set(
                lectures
                    .filter((lec) => lec?._id)
                    .map((lec) => String(lec._id))
            );

            const lectureIdsToDelete = existingLectures
                .filter((lec) => !incomingLectureIds.has(String(lec._id)))
                .map((lec) => lec._id);

            if (lectureIdsToDelete.length > 0) {
                await lectureModel.deleteMany({ _id: { $in: lectureIdsToDelete } });
            }

            for (let j = 0; j < lectures.length; j++) {
                const incomingLecture = lectures[j];
                const lectureTitle = incomingLecture.title ?? "";
                const lectureVideoUrl = incomingLecture.videoUrl ?? "";

                if (incomingLecture._id && existingLectureIds.has(String(incomingLecture._id))) {
                    await lectureModel.updateOne(
                        { _id: incomingLecture._id, moduleId: currentModuleId },
                        { title: lectureTitle, videoUrl: lectureVideoUrl, orderIndex: j + 1 }
                    );
                } else {
                    await lectureModel.create({
                        moduleId: currentModuleId,
                        title: lectureTitle,
                        videoUrl: lectureVideoUrl,
                        orderIndex: j + 1
                    });
                }
            }
        }

        return res.json({
            message: "Course, modules, and lectures synced successfully"
        });
    } catch (error) {
        console.log("Full course sync error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});

module.exports = adminrouter;
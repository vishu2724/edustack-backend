const express = require("express");
const courserouter = express.Router();
const mongoose = require("mongoose");

const {courseModel} = require("../models/db");



// Public Courses Route(No login required)
courserouter.get("/",async(req,res)=>{
    try{
        const courses = await courseModel.find({});

        res.json({
            message : "ALL COURSES",
            courses : courses
        });
    }

    catch(e){
     res.status(500).json({
        message: "Server error",
        error :e
     });
    }
});

courserouter.get("/:id", async(req,res)=>{
   try{
    const courseId = req.params.id;

    // validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
            message: "Invalid course ID"
        });
   }

   const course = await courseModel.findById(courseId);

   if(!course){
    return res.status(404).json({
        message : "course not found"
    });
   }
   res.json({
    message: "Course details",
    course: course
});

   }
   catch(e){
    res.status(500).json({
        message: "Server error",
        error: e
    });
   }



});

courserouter.get("/previewcourse", (req,res)=>{
    res.json({
        message : "your purchased courses"
    })
})


courserouter.post("/purchase", (req,res)=>{
    res.json({
        message : "jo course purchase krega"
    })
})

module.exports = courserouter;
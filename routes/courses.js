const express = require("express");
const courserouter = express.Router();
const mongoose = require("mongoose");

const {courseModel} = require("../models/db");
const { moduleModel } = require("../models/db");
const { lectureModel } = require("../models/db");



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


courserouter.post("/module", async (req, res) => {
    try {
        const { title, courseId, orderIndex } = req.body;

        // Validation
        if (!title || !courseId) {
            return res.status(400).json({
                message: "Title and courseId are required"
            });
        }

        // Check valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                message: "Invalid courseId"
            });
        }

        //  Check course exists
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        //  Create module
        const module = await moduleModel.create({
            title,
            courseId,
            orderIndex
        });

        res.json({
            message: "Module created successfully",
            module
        });

    } catch (e) {
        res.status(500).json({
            message: "Server error",
            error: e.message
        });
    }
});


courserouter.post("/lecture", async (req, res) => {
    try {
        const { title, videoUrl, moduleId, orderIndex } = req.body;

        // validation
        if (!title || !moduleId) {
            return res.status(400).json({
                message: "Title and moduleId required"
            });
        }

        // check valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({
                message: "Invalid moduleId"
            });
        }

        // check module exists
        const module = await moduleModel.findById(moduleId);
        if (!module) {
            return res.status(404).json({
                message: "Module not found"
            });
        }

        // create lecture
        const lecture = await lectureModel.create({
            title,
            videoUrl,
            moduleId,
            orderIndex
        });

        res.json({
            message: "Lecture created successfully",
            lecture
        });

    } catch (e) {
        res.status(500).json({
            message: "Server error",
            error: e.message
        });
    }
});

courserouter.get("/:courseId/full", async (req, res) => {
    try {
        const { courseId } = req.params;

        // validate courseId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                message: "Invalid courseId"
            });
        }

        // get course
        const course = await courseModel.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        // get modules
        const modules = await moduleModel
            .find({ courseId })
            .sort({ orderIndex: 1 });

        // build full structure
        const finalData = [];

        for (let mod of modules) {
            const lectures = await lectureModel
                .find({ moduleId: mod._id })
                .sort({ orderIndex: 1 });

            finalData.push({
                moduleId: mod._id,
                moduleTitle: mod.title,
                lectures: lectures
            });
        }

        res.json({
            course,
            modules: finalData
        });

    } catch (e) {
        res.status(500).json({
            message: "Server error",
            error: e.message
        });
    }
    

});



module.exports = courserouter;
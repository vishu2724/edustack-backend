const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const MONGO_URL = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URL)
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => {
    console.error(" MongoDB connection error:", err.message);
  });

const userSchema = new Schema({
    firstName : String,
    lastName : String,
    password : String,
    email : {type : String, unique : true,}
});

const adminSchema = new Schema({
    firstName : String,
    lastName : String,
    password : String,
    email : {type : String, unique : true,}
});

const coursesSchema = new Schema({
    title : String,
    description : String,
    creatorId : ObjectId,
    price : Number,
    imageUrl : String
});

const purchaseSchema = new Schema({
    userId : ObjectId,
    courseId : ObjectId
});

const moduleSchema = new Schema({
    courseId : ObjectId,
    title : String,
    orderIndex : Number
});

const lectureSchema = new Schema({
    moduleId : ObjectId,
    title : String, 
    videoUrl : String,
    orderIndex : Number
});

const userModel = mongoose.model("user",userSchema);
const adminModel = mongoose.model("admin",adminSchema);
const courseModel = mongoose.model("course",coursesSchema);
const purchaseModel = mongoose.model("purchase",purchaseSchema);
const moduleModel = mongoose.model("module",moduleSchema);
const lectureModel = mongoose.model("lecture",lectureSchema);   

module.exports= {
    userModel,
    adminModel,
    courseModel,
    purchaseModel,
    moduleModel,
    lectureModel}






const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;
mongoose.connect("mongodb://127.0.0.1:27017/course_app")
  .then(() => console.log("✅ MongoDB Connected"))

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

const userModel = mongoose.model("user",userSchema);
const adminModel = mongoose.model("admin",adminSchema);
const courseModel = mongoose.model("course",coursesSchema);
const purchaseModel = mongoose.model("purchase",purchaseSchema);

module.exports= {
    userModel,
    adminModel,
    courseModel,
    purchaseModel
}






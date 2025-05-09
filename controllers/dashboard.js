const database = require("../lib/db");
const jwt = require("../lib/jwt");


const fetchCourses = async (req, res) => {
    if(req.cookies.token){
        try {
            let payload = jwt.verify(req.cookies.token);
            if(payload.department && payload.semester){
                let courses = await database.query(`SELECT * FROM courses WHERE semester = ? AND department LIKE ?`, [payload.semester,  `%${payload.department}%`]);
                return res.status(200).json({success: true, courses: courses});
            }
        }catch(err){
            return res.status(401).send({success:false, message:err.message});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

const fetchNotifications = async (req, res) => {
    if(req.cookies.token){
        try {
            let payload = jwt.verify(req.cookies.token);
            if(payload.id){
                let courses = await database.query(`SELECT * FROM notifications WHERE user_id = ?`, [payload.id]);
                return res.status(200).json({success: true, notifications: courses});
            }
        }catch(err){
            return res.status(401).send({success:false, message:err.message});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

const fetchLectures = async (req, res) => {
    if(req.cookies.token){
        try {
            let {course_id} = req.body;
            if(course_id){
                let lectures = await database.query(`SELECT * FROM course_materials WHERE course_id = ?`, [course_id]);
                return res.status(200).json({success: true, lectures: lectures});
            }
        }catch(err){
            return res.status(401).send({success:false, message:err.message});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

const fetchPdfs = async (req, res) => {
    if(req.cookies.token){
        try {
            let {course_id} = req.body;
            if(course_id){
                let pdfs = await database.query(`SELECT * FROM course_materials WHERE course_id = ?`, [course_id]);
                return res.status(200).json({success: true, pdfs});
            }
        }catch(err){
            return res.status(401).send({success:false, message:err.message});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

const fetchQuizzes = async (req, res) => {
    if(req.cookies.token){
        try {
            if(req.body.from === "dashboard"){
                let {course_id} = req.body;
                if(course_id){
                    let quizzes = await database.query(`SELECT id, title FROM quiz WHERE course_id = ?`, [course_id]);
                    return res.status(200).json({success: true, quizzes});
                }
            }else{
                let {quiz_id} = req.body;
                if(quiz_id){
                    let quizzes = await database.query(`SELECT * FROM quiz WHERE id = ?`, [quiz_id]);
                    return res.status(200).json({success: true, quizzes});
                }
            }
        }catch(err){
            return res.status(401).send({success:false, message:err.message});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

const fetchExams = async (req, res) => {
    if(req.cookies.token){
        try {
            let {course_id} = req.body;
            if(course_id){
                let exams = await database.query(`SELECT * FROM exams WHERE course_id = ?`, [course_id]);
                return res.status(200).json({success: true, exams});
            }
        }catch(err){
            return res.status(401).send({success:false, message:err.message});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

module.exports = {fetchCourses, fetchNotifications, fetchLectures, fetchPdfs, fetchQuizzes, fetchExams}
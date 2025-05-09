const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const classroom_controller = require("../controllers/classroom");
const auth_controller = require("../controllers/auth");
const dashboard_controller = require("../controllers/dashboard");

router.post("/auth/login", auth_controller.login);
router.post("/auth/register", auth_controller.register);
router.get("/auth/logout", auth_controller.logout);
router.post("/dashboard/notifications", dashboard_controller.fetchNotifications);

router.post("/dashboard/courses", dashboard_controller.fetchCourses);
router.post("/dashboard/courses/lectures", dashboard_controller.fetchLectures);
router.post("/dashboard/courses/pdfs", dashboard_controller.fetchPdfs);
router.post("/dashboard/courses/quizzes", dashboard_controller.fetchQuizzes);
router.post("/dashboard/courses/exams", dashboard_controller.fetchExams);

router.post("/classroom/list", classroom_controller.fetchClassrooms);
router.post("/classroom/gentoken", classroom_controller.generateToken);
router.post("/classroom/create", classroom_controller.createClassroom);
router.post("/classroom/validate", classroom_controller.validateClassroom);
router.post("/classroom/destroy", classroom_controller.destroyClassroom);


router.get("/json", (req, res) => {
    let quizData = [{
            text: "What is the capital of France?",
            answers: ["A. Berlin", "B. Paris", "C. Rome", "D. Madrid"],
            correct: "B. Paris"
        },
        {
            text: "What is 2 + 2?",
            answers: ["A. 3", "B. 4", "C. 5", "D. 6"],
            correct: "B. 4"
        },
        {
            text: "Which planet is known as the Red Planet?",
            answers: ["A. Venus", "B. Mars", "C. Jupiter", "D. Saturn"],
            correct: "D. Saturn"
        }]
    res.send(JSON.stringify(quizData))
})


module.exports = router;
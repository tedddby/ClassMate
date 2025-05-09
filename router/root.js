const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const authController = require("../controllers/auth.js");


router.get("/", (req, res) => {
    res.render("index");
});

router.get("/index", (req, res) => {
    res.render("index");
});

router.get("/register", authController.checkLogin, (req, res) => {
    if(!req.loggedin){
        res.render("register");
    }else{
        res.redirect('/dashboard');
    }
});

router.get("/login", authController.checkLogin, (req, res) => {
    if(!req.loggedin){
        res.render("login");
    }else{
        res.redirect('/dashboard');
    }
});

router.get("/dashboard", authController.checkLogin, (req, res) => {
    if(req.loggedin){
        if(req.user.name.includes(" ")){
            let splitted_name = req.user.name.split(" ");
            req.user.name = splitted_name[0];
        }
        res.render("dashboard", {user: req.user});
    }else{
        res.redirect('/login');
    }
});

router.get("/quiz", authController.checkLogin, (req, res) => {
    if(req.loggedin){
        res.render("quiz");
    }else{
        res.redirect('/login');
    }
});

router.get("/classroom.list", authController.checkLogin,(req, res) => {
    if(req.loggedin){
        res.render("classroom.list.hbs");
    }else{
        res.redirect('/dashboard');
    }
});

router.get("/classroom.live", authController.checkLogin,(req, res) => {
    if(req.loggedin){
        res.render("classroom");
    }else{
        res.redirect('/dashboard');
    }
});

router.get("/classroom.live.v2", authController.checkLogin,(req, res) => {
    if(req.loggedin){
        res.render("classroom2");
    }else{
        res.redirect('/dashboard');
    }
});





module.exports = router;
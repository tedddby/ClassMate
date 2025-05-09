const database = require("../lib/db");
const jwt = require("../lib/jwt");
const pw = require("../lib/pw");


const register = async (req,res) => {
    if(req.body){
        let {name, email, password, semester, department} = req.body;
        let phone;
        if(req.body.phone){
            phone = req.body.phone;
        }else{
            phone = "N/A";
        }

        let hashedPassword = await pw.hashPassword(password);
        try{
            let query = `INSERT INTO users (name, email, password, phone_number, department, semester) VALUES (?, ?, ?, ?, ?, ?)`;
            let q = await database.query(query, [name, email, hashedPassword, phone, department, semester]);
            let regNotif = {
                id: q.insertId,
                title:"test",
                body:"test"
            }
            await database.query(`INSERT INTO notifications (user_id, notification_title, notification_body) VALUES (?, ?, ?)`, [regNotif.id, regNotif.title, regNotif.body])
            return res.status(200).json({success: true, message: "User added successfully. Redirecting to login page."});
        }catch (e){
            console.log(e);
            return res.status(401).json({success: false, message: "Something went wrong"});
        }

    }else{
        return res.status(401).json({success: false, message: "Something went wrong"});
    }
}

const login = async (req,res) => {
    if(req.body){
        let {email, password, remember} = req.body;
        let cookieExpiry;

        if(remember){
            cookieExpiry = 7 * 24 * 60 * 60 * 1000;
        }else{
            cookieExpiry = 4 * 60 * 60 * 1000;
        }

        try{
            let query = `SELECT * FROM users WHERE email = ?`;
            let rows = await database.query(query, [email]);

            if(rows.length !== 0){
                let correctPassword = await pw.verifyPassword(password, rows[0].password);

                if(correctPassword){
                    delete rows[0].password;
                    let token = jwt.encode(rows[0]);
                    res.cookie('token', token, {
                        httpOnly: true,
                        expires: new Date(Date.now()+cookieExpiry)
                    });

                    return res.status(200).json({success: true, message: "Redirecting to dashboard."});
                }else{
                    return res.status(200).json({success: false, message: "Invalid email or password."});
                }
            }else{
                return res.status(200).json({success: false, message: "No such email or password."});
            }
        }catch (e){
            console.log(e);
            return res.status(401).json({success: false, message: "Something went wrong"});
        }
    }else{
        return res.status(401).json({success: false, message: "Something went wrong"});
    }
}

const checkLogin = (req, res, next) => {
    try{
        if(req.cookies.token){
            try {
                req.user = jwt.verify(req.cookies.token);
                req.loggedin = true;
                return next();
            }catch(e){
                req.loggedin = false;
                return next();
            }
        }else{
            req.loggedin = false;
            return next();
        }
    }catch (e){
        console.log(e);
        res.redirect("/");
    }
}

const logout = (req,res) => {
    if(req.cookies.token){
        res.cookie("token", "LoggedOut", { httpOnly:true, expires:new Date(Date.now() + 2*1000) });
        return res.redirect("/login");
    }else{
        return res.redirect('/login');
    }
}

module.exports = {login, register, checkLogin, logout};


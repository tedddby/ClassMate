const jwtService = require("../lib/jwt");
const jwt = require("jsonwebtoken");
const database = require("../lib/db");

const API_KEY = "4c2e347d-9eef-4568-93bf-de35ef9365e6";
const SECRET_KEY = "0fe1f58d96c839ac3fcc0156699eec6e4d03deaa20e6dea63a583eaede7ed41b";

const fetchClassrooms = async (req, res) => {
    if(req.cookies.token){
        try {
            let classrooms = await database.query(`SELECT * FROM classrooms`, null);
            return res.status(200).json({success: true, classrooms});
        }catch(err){
            return res.status(401).send({success:false, message:err.message});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

const generateToken = (req, res) => {
    if(req.cookies.token){
        var options = {
            expiresIn: '120m',
            algorithm: 'HS256'
        };

        var payload = {
            apikey: API_KEY,
            permissions: [`allow_join`],
            roles: ['crawler', 'rtc'],
        };

        var token = jwt.sign(payload, SECRET_KEY, options);
        return res.json({success: true, token});
    }else{
        return res.status(401).json({success: false, message: 'Unauthorized request'});
    }
}

const createClassroom = async (req, res) => {
    if(req.cookies.token){
        try{
            let user = jwtService.verify(req.cookies.token);
            if(user.name){
                if(req.body.roomToken && req.body.title){
                    const { roomToken, title } = req.body;
                    const response = await fetch('https://api.videosdk.live/v2/rooms', {
                        method: 'POST',
                        headers: {
                            Authorization: roomToken,
                            'Content-Type': 'application/json',
                        },
                    });
                    const data = await response.json();

                    try{
                        database.query('INSERT INTO `classrooms`(`title`, `host`, `room_id`, `authToken`) VALUES (?,?,?,?)', [title, user.name, data.roomId, roomToken]);
                    }catch (e){
                        return res.status(400).json({success: false});
                    }
                    return res.status(200).json({success: true, roomId:data.roomId, displayName:user.name+" (Host)"});
                }else{
                    return res.status(401).json({success: false, message: 'Unauthorized request'});
                }
            }else{
                return res.status(401).json({success: false, message: 'Unauthorized request'});
            }
        }catch (e){
            return res.status(401).json({success: false, message: 'Unauthorized request'});
        }
    }else{
        return res.status(401).json({success: false, message: 'Unauthorized request'});
    }
}

const validateClassroom = async (req, res) => {
    if(req.cookies.token){
        try{
            let user = jwtService.verify(req.cookies.token);
            if(user.name){
                if(req.body.roomToken && req.body.roomId){
                    const { roomToken, roomId } = req.body;
                    const response = await fetch(`https://api.videosdk.live/v2/rooms/validate/${roomId}`, {
                        method: "GET",
                        headers: { Authorization: roomToken },
                    });
                    const data = await response.json();
                    if(data.roomId === roomId){
                        res.status(200).json({success: true, roomId:roomId, displayName:user.name});
                    }else{
                        res.status(200).json({success: true});
                    }
                }else{
                    return res.status(401).json({success: false, message: 'Unauthorized request'});
                }
            }else {
                return res.status(401).json({success: false, message: 'Unauthorized request'});
            }
        }catch (e){
            return res.status(401).json({success: false, message: 'Unauthorized request'});
        }
    }else{
        return res.status(401).json({success: false, message: 'Unauthorized request'});
    }
}

const destroyClassroom = async (req, res) => {
    if(req.cookies.token){
        if(req.body.roomId){
            try {
                await database.query('DELETE FROM `classrooms` WHERE `room_id` = ?', [req.body.roomId]);
                return res.status(200).json({success: true});
            }catch(err){
                console.log(err.message);
                return res.status(401).send({success:false, message:err.message});
            }
        }else{
            return res.status(401).send({success:false, message:"Unauthorized request"});
        }
    }else{
        return res.status(401).send({success:false, message:"Unauthorized request"});
    }
}

module.exports = {generateToken, createClassroom, fetchClassrooms, validateClassroom, destroyClassroom};
//console.log(token);
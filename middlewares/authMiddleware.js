import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async(req, res, next) => {
    try{
        const token = req.cookies.token;

        if(!token){
            return res.status(401).json({message:"not authorized"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select("-password");
        next();
    }catch(error){
        res.status(401).json({message:"Invalid token"})
    }
}
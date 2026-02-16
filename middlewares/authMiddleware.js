import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async(req, res, next) => {
    try{
        // accept token from cookie OR Authorization header (Bearer)
        let token = req.cookies?.token;

        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if(!token){
            console.log('[AUTH][protect] missing token in request (cookies + Authorization header)');
            return res.status(401).json({message:"not authorized"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select("-password");
        next();
    }catch(error){
        console.log('[AUTH][protect] token verification failed:', error.message);
        res.status(401).json({message:"Invalid token"})
    }
}
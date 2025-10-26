import express from 'express';
import { signup, login, logout, updateProfilePic } from '../controllers/auth.controller.js';
import {protectRoute} from "../middlewares/auth.middleware.js";
import {arcjetProtection} from "../middlewares/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection);  // apply arcjetProtection middleware to "all auth routes"

// router.get("/test", arcjetProtection, (_, res) => {res.status(200).json({message: "Test route"})}); // test route to verify arcjetProtection middleware
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);  // post request because get requests can be cached by browsers and intermediate proxies which may lead to security issues

router.put("/update-profile", protectRoute, updateProfilePic);

router.get("/check-auth", protectRoute, (req, res) => res.status(200).json({ message: "Authorized", user: req.user })); // route to check if the user is authenticated (when the frontend loads, it can call this route to verify if the user is logged in)

export default router;
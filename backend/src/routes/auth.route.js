import express from 'express';
import { signup, login, logout } from '../controllers/auth.controllers.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);  // post request because get requests can be cached by browsers and intermediate proxies which may lead to security issues

export default router;
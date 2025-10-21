import {Resend} from "resend";
import { ENV } from "./env.js";

export const resendClient = new Resend(ENV.RESEND_API_KEY);  // use this to send emails

export const sender = {                     // sender information
    email: ENV.EMAIL_FROM,
    name: ENV.EMAIL_FROM_NAME,
}
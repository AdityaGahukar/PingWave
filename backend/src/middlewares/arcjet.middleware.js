import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
    if (process.env.NODE_ENV !== "production") return next(); // skip in development (postman is detected as bot)

    try{
        const decision = await aj.protect(req);

        if(decision.isDenied()){  // access denied by arcjet
            if(decision.reason.isRateLimit()){  // rate limit exceeded
                return res.status(429).json({ message: "Rate limit exceeded. Please try again later."});
            } 
            else if(decision.reason.isBot()){  // identified as bot
                return res.status(403).json({ message: "Bot access denied."});
            }
            else { 
                return res.status(403).json({ message: "Access denied by security policy."});
            }
        }

        // check for spoofed bots (bots pretending to be real humans --> also handled by arcjet)
        if(decision.results.some(isSpoofedBot)){
            return res.status(403).json({
                error: "Spoofed bot detected. Access denied.",
                message: "Malicious bot activity detected. Access denied."
            });
        }

        next(); // proceed to the next middleware or route handler (nothing denied and not a spoofed bot)
    } catch (error) {
        console.error("Error in arcjetProtection middleware: ", error);
        res.status(500).json({ message: "Server error" });
    }
};
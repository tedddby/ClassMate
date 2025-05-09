const jwt = require('jsonwebtoken');
require("dotenv").config({ path: "./protected.env" });
const env = process.env;

class JWTService {
    constructor() {
        this.secretKey = env.JWT_SECRET;
        this.expiresIn = env.JWT_EXPIRES_IN;
    }

    encode(payload) {
        try {
            const token = jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
            return token;
        } catch (error) {
            console.error("Error encoding token:", error.message);
            throw error;
        }
    }

    verify(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return decoded;
        } catch (error) {
            console.error("Error verifying token:", error.message);
            throw error;
        }
    }

    decode(token) {
        try {
            const decoded = jwt.decode(token, { complete: true });
            return decoded;
        } catch (error) {
            console.error("Error decoding token:", error.message);
            throw error;
        }
    }
}

module.exports = new JWTService();

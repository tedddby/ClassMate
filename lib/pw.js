const bcrypt = require('bcrypt');

class PasswordService {
    constructor() {
        this.saltRounds = 10;
    }


    async hashPassword(password) {
        try {
            const salt = await bcrypt.genSalt(this.saltRounds);
            const hashedPassword = await bcrypt.hash(password, salt);
            return hashedPassword;
        } catch (error) {
            console.error("Error hashing password:", error.message);
            throw error;
        }
    }


    async verifyPassword(password, hashedPassword) {
        try {
            const match = await bcrypt.compare(password, hashedPassword);
            return match;
        } catch (error) {
            console.error("Error verifying password:", error.message);
            throw error;
        }
    }
}

module.exports = new PasswordService();

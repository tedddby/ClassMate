require("dotenv").config({ path: "./protected.env" });
const env = process.env;
const mysql = require('mysql2');

class DatabaseConnection {
    constructor() {
        try{
            this.connection = mysql.createPool({
                host: env.DB_HOST,
                user: env.DB_USER,
                password: env.DB_PASSWORD,
                database: env.DB_NAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            this.pool = this.connection.promise();
            console.log("connected to database");
        }catch(e){
            console.error(e);
        }
    }

    async query(sql, params) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database Query Error:', error.message);
            throw error;
        }
    }

    close() {
        return this.pool.end();
    }
}

module.exports = new DatabaseConnection();

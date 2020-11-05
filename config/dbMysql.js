const {createPool} =require('mysql')
const pool  = createPool({
    connectionLimit : process.env.mysqlLimit,
    host            : process.env.mysqlHost,
    user            : process.env.mysqlUser,
    password        : process.env.mysqlPassword,
    database        : process.env.mysqlDatabase
});

module.exports=pool
const jwt = require('jsonwebtoken')
require('dotenv')

const verifyToken=(req,res,next)=>{
    if ("authorization" in req.headers){
        const authHeader = req.headers.authorization.split(" ")
        if (authHeader.length > 1) {
            const token = authHeader[1]
            const key = process.env.jwt_key

            try {
                const statusToken = jwt.verify(token, key)
                return next(statusToken)
            } catch (err) {
                return res.status(401).json({
                    status: '401',
                    response: {
                        title: 'Error',
                        message: 'Invalid Authentication!'
                    }
                });
            }
        }
    }
    return res.status(401).json({
        status: '401',
        response: {
            title: 'Error',
            message: 'Invalid Authentication!'
        }
    });
    // return res.status(401).send({
    //     error: "Invalid authentication!!"
    // })
}
module.exports = verifyToken
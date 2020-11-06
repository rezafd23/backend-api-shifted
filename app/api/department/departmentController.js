const router = require('express').Router();

const conn = require('../../../config/dbMysql')
router.get('/department', (req, res) => {
    try {
        conn.query("SELECT * from department where status=1",
            function (error, result, fields) {
                if (error) {
                    console.log("ERROR", error)
                    return res.status(400).send({error})
                    // return cb("INTERNAL ERROR",null)
                }
                if (result) {
                    return res.status(200).json({
                        status: 200,
                        response: {
                            status: "success",
                            payload: result,
                        }
                    })
                }
            })
    } catch (err) {
        console.log("ERROR CATCH ", err)
    }
})

module.exports = router
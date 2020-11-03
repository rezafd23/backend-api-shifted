const userModel = require('./userModel');
const router = require('express').Router();
const userSchema = require('../users/userSchema');
const jwt =require('jsonwebtoken')
const jwtAuth=require('../../util/jwtAuth')
require('dotenv');

var unAuthorizedRes=(res)=>{
    return res.status(401).json({
        status: 401,
        response: {
            message: 'Unauthorized!',
            // data:checkUser
        }
    });
}

router.post('/register', async (req, res) => {
    const {error} = userSchema.registrationSchema(req.body);
    if (error) {
        return res.status(400).json({
            status: 400,
            response: {
                title: 'Error Validation Data',
                message: error.details[0].message
            }
        });
    }

    const emailExist = await userModel.findOne({email: req.body.email});

    if (emailExist) {
        return res.status(400).json({
            status: '400',
            response: {
                title: 'Error',
                message: "User's Email is exist"
            }
        });
    }

    const user = new userModel({
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        noHp: req.body.noHp,
        tempatLahir: req.body.tempatLahir,
        tglLahir: req.body.tglLahir,
        alamat: req.body.alamat,
        role: "user",
        status: "1",
    })
    try {
        const savedUser = await user.save();
        console.log(savedUser);
        return res.status(200).json({
            status: 200,
            response: 'Success Add User'
        });
    } catch (err) {
        return res.status(400).json({
            status: 400,
            response: {
                title: 'Error',
                message: err
            }
        });
    }
});

router.post('/login', async (req, res) => {
    const {error} = userSchema.loginSchema(req.body);
    if (error) {
        return res.status(400).json({
            status: 400,
            response: {
                title: 'Error Validation Data',
                message: error.details[0].message
            }
        });
    }

    const emailExist = await userModel.findOne({email: req.body.email});
    if (!emailExist) {
        return res.status(400).json({
            status: '400',
            response: {
                title: 'Error',
                message: 'Email Not Found'
            }
        });
    } else if (emailExist.password === req.body.password) {
        let user={
            email:emailExist.email,
            role:emailExist.role
        }
        const token = jwt.sign(user,process.env.jwt_key,{expiresIn: process.env.expiresIn})
        console.log("isi token ",token)
        return res.status(200).json({
            status: 200,
            response: {
                status: "success",
                isLogined: "true",
                access_token: token,
                payload: emailExist
            }
        })
        // res.status(200).header('auth-token', token).send(token);
    } else {
        return res.status(400).json({
            status: 400,
            response: {
                title: 'Error',
                message: 'Wrong Password'
            }
        });
    }
});

router.get('/users', jwtAuth, async (dataLogin,req, res,next) => {
    let dataUser = []
    const posts = await userModel.find({email:dataLogin.email})
    dataUser = posts
    dataUser.map((val, idx) => {
        // console.log("isival",val.role)
        if (val.role === "admin") {
            dataUser.splice(idx, 1)
        }
    })
    return res.status(200).json({
        status: 200,
        response: {
            message: 'Success',
            payload: dataUser
        }
    });
})
router.get('/users/all',jwtAuth, async (dataLogin,req, res,next) => {
    const posts = await userModel.find({status:"1"})

    console.log("isi ",posts)
    if (dataLogin.role==="admin"){
        return res.status(200).json({
            status: 200,
            response: {
                message: 'Success',
                payload: posts
            }
        });
    } else {
        unAuthorizedRes(res)
    }
})

// router.get('/edit/:id', (req,res) => {
//     User.findById({_id : req.params.id})
//         .then(data => res.send(data))
// })
router.put('/edit/:id', jwtAuth,(dataLogin,req,res,next) => {
    if (dataLogin.role==="admin"){
        userModel.findByIdAndUpdate({_id : req.params.id}, { $set:
                {
                    name : req.body.name,
                    email : req.body.email,
                    noHp : req.body.noHp,
                    tempatLahir : req.body.tempatLahir,
                    tglLahir : req.body.tglLahir,
                    alamat : req.body.alamat,
                }})
            .then(data => {
                userModel.find({})
                    .then(data =>
                            res.status(200).json({
                                status: 200,
                                response: {
                                    message: "success"
                                }
                            })
                        // res.send(data))
                    )})
    }
    else {
        unAuthorizedRes(res)
    }
})

router.delete('/delete/:id',jwtAuth, (dataLogin,req,res,next) => {
    if (dataLogin.role==="admin"){
        userModel.findOneAndUpdate({_id : req.params.id}, { $set:
                {
                    status:"0"
                }})
            .then(data => {
                userModel.find({})
                    .then(data =>
                            res.status(200).json({
                                status: 200,
                                response: {
                                    status: "success",
                                    payload: data
                                }
                            })
                        // res.send(data))
                    )})
    } else {
        unAuthorizedRes(res)
    }

})


module.exports = router
const userModel = require('./userModel');
const router = require('express').Router();
const userSchema = require('../users/userSchema');
const jwt = require('jsonwebtoken')
const jwtAuth = require('../../util/jwtAuth')
const conn = require('../../../config/dbMysql')
// require('dotenv');

var unAuthorizedRes = (res) => {
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
        let user = {
            email: emailExist.email,
            role: emailExist.role
        }
        const token = jwt.sign(user, process.env.jwt_key, {expiresIn: process.env.expiresIn})
        console.log("isi token ", token)
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

router.get('/users', jwtAuth, async (dataLogin, req, res, next) => {
    let dataUser = []
    const posts = await userModel.find({email: dataLogin.email})
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
router.get('/users/all', jwtAuth, async (dataLogin, req, res, next) => {
    const posts = await userModel.find({status: "1"})

    console.log("isi ", posts)
    if (dataLogin.role === "admin") {
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
router.put('/edit/:id', jwtAuth, (dataLogin, req, res, next) => {
    console.log("dataLogin ", dataLogin)
    if (dataLogin.role === "1") {
        userModel.findByIdAndUpdate({_id: req.params.id}, {
            $set:
                {
                    name: req.body.name,
                    email: req.body.email,
                    noHp: req.body.noHp,
                    tempatLahir: req.body.tempatLahir,
                    tglLahir: req.body.tglLahir,
                    alamat: req.body.alamat,
                }
        })
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
                    )
            })
    } else {
        unAuthorizedRes(res)
    }
})

router.delete('/delete/:id', jwtAuth, (dataLogin, req, res, next) => {
    if (dataLogin.role === "admin") {
        userModel.findOneAndUpdate({_id: req.params.id}, {
            $set:
                {
                    status: "0"
                }
        })
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
                    )
            })
    } else {
        unAuthorizedRes(res)
    }

})

// mysql
router.post('/login/mysql', (req, res) => {
    const {username, password} = req.body
    try {
        conn.query("SELECT roleId from user where username=? and password=?",
            [username, password],
            function (error, result, fields) {
                if (error) {
                    console.log("ERROR", error)
                    return res.status(400).send({error})
                    // return cb("INTERNAL ERROR",null)
                }
                if (result) {
                    console.log("isi result ",result[0].roleId)
                    const dataUser = {
                        username,
                        role: result[0].roleId
                    }
                    const token = jwt.sign(dataUser, process.env.jwt_key, {expiresIn: process.env.expiresIn})
                    console.log("isi token ", token)
                    return res.status(200).json({
                        status: 200,
                        response: {
                            status: "success",
                            isLogined: "true",
                            access_token: token,
                        }
                    })
                }
            })
    } catch (err) {
        console.log("ERROR CATCH ", err)
    }
})

router.get('/users/all/sql',jwtAuth,(dataLogin,req,res,next)=>{
    // const posts = await userModel.find({status: "1"})

    console.log("isi ",dataLogin)
    if (dataLogin.role === 1) {
        try {
            conn.query("SELECT a.empName as Nama,a.empJabatan as Jabatan,  d.deptName as Departemen,b.username as Username ,c.roleName as Role FROM `employee` a left JOIN user b on a.empId=b.empId\n" +
                "LEFT JOIN role c on b.roleId=c.roleId \n" +
                "LEFT JOIN department d ON a.deptId=d.deptId\n" +
                "WHERE a.empStatus=1",
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
                                payload: result
                            }
                        })
                    }
                })
        } catch (err) {
            console.log("ERROR CATCH ", err)
        }
    } else {
        // if (dataLogin){
            try {
                conn.query("SELECT a.empName as Nama,a.empJabatan as Jabatan,  d.deptName as Departemen,b.username as Username ,c.roleName as Role FROM `employee` a left JOIN user b on a.empId=b.empId\n" +
                    "LEFT JOIN role c on b.roleId=c.roleId \n" +
                    "LEFT JOIN department d ON a.deptId=d.deptId\n" +
                    "WHERE a.empStatus=1 AND b.status=1 AND b.username=?",[dataLogin.username],
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
                                    payload: result
                                }
                            })
                        }
                    })
            } catch (err) {
                console.log("ERROR CATCH ", err)
            }
        // }
        // else {
        //     unAuthorizedRes(res)
        // }
    }
})

router.get('/users/all/sql/:id',jwtAuth,(dataLogin,req,res,next)=>{
    // const posts = await userModel.find({status: "1"})

    console.log("isi ",dataLogin)
    if (dataLogin) {
        try {
            conn.query("SELECT a.empNIK, a.empName as Nama,a.empJabatan as Jabatan,  d.deptName as Departemen," +
                "b.username as Username ,c.roleName as Role ,a.empGender,a.empTmptLahir,a.empTglLahir," +
                "a.empAddress, a.empAgama,a.empMaritalStatus,a.empGolDarah,a.empJabatan,a.deptId,b.password " +
                "FROM `employee` a left JOIN user b on a.empId=b.empId " +
                "LEFT JOIN role c on b.roleId=c.roleId LEFT JOIN department d ON a.deptId=d.deptId " +
                "WHERE a.empStatus=1 AND b.status=1 AND b.username=?",[req.params.id],
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
                                payload: result
                            }
                        })
                    }
                })
        } catch (err) {
            console.log("ERROR CATCH ", err)
        }
    } else {
        unAuthorizedRes(res)
    }
})

// router.post('/users/add',jwtAuth,(dataLogin,req,res,next)=>{
router.post('/users/add',(req,res)=>{
    // const posts = await userModel.find({status: "1"})
    const {nik,name,address,gender,tmptLahir,tglLahir,agama,marital,blood,jabatan,dept,
    username,password,roleId}=req.body
    // console.log("ceklogin ",dataLogin)
    // if (dataLogin.role === 1) {
    try {
        conn.query("Select a.empNIK from employee a inner join user b on a.empId=b.empId where b.username=? and a.empStatus=1 and b.status=1",
            [username],
            function (error,result,fields){
            if (error){
                console.log("ERROR CEK USER", error)
                return res.status(400).json({
                    status: 400,
                    response: {
                        status: "error",
                        message: error
                    }
                })
            }
            if (result.length<1){
                try {
                    // INSERT INTO `employee` VALUES (null,'a','a','a','L','1','2020-11-11','a','Kawin','A',1,1,'1')
                    conn.query("INSERT INTO `employee` VALUES (null,?,?,?,?,?,?,?,?,?,?,?,1)",
                        [nik,name,address,gender,tmptLahir,tglLahir,agama,marital,blood,jabatan,dept],
                        function (error, result, fields) {
                            if (error) {
                                console.log("ERROR", error)
                                return res.status(400).json({
                                    status: 400,
                                    response: {
                                        status: "error",
                                        message: error
                                    }
                                })
                            }
                            if (result) {
                                try {
                                    conn.query("INSERT INTO `user` VALUES (null ,?,?,?,2,1)",
                                        [username,password,result.insertId],
                                        function (error,resut,fields){
                                            if (error){
                                                console.log("ERROR-USER" ,error)
                                                return res.status(400).json({
                                                    status: 400,
                                                    response: {
                                                        status: "error",
                                                        message: error
                                                    }
                                                })
                                            }
                                            return res.status(200).json({
                                                status: 200,
                                                response: {
                                                    status: "success",
                                                    message: "Success Add Data"
                                                }
                                            })
                                        })
                                } catch (err) {
                                    console.log("ERROR CATCH ", err)
                                    return res.status(400).json({
                                        status: 400,
                                        response: {
                                            status: "error",
                                            message: err
                                        }
                                    })
                                }



                            }
                        })
                } catch (err) {
                    console.log("ERROR CATCH ", err)
                    return res.status(400).json({
                        status: 400,
                        response: {
                            status: "error",
                            message: err
                        }
                    })
                }
            } else {
                return res.status(400).json({
                    status: 400,
                    response: {
                        status: "error",
                        message: "data exist!"
                    }
                })
            }
            })
    } catch (err){
        console.log("ERROR Catch 1", err)
        return res.status(400).json({
            status: 400,
            response: {
                status: "error",
                message: err
            }
        })
    }

    // } else {
    //     unAuthorizedRes(res)
    // }
})

router.put('/users/edit/:id',jwtAuth,(dataLogin,req,res,next)=>{
    const {nik,name,address,gender,tmptLahir,tglLahir,agama,marital,golDarah,jabatan,deptId,
        username,password}=req.body
    console.log("dataLogin",dataLogin)
    console.log("dataLogin",agama)
    console.log("dataLogin",agama)

    if (dataLogin.role === 1) {
        try {
            // INSERT INTO `employee` VALUES (null,'a','a','a','L','1','2020-11-11','a','Kawin','A',1,1,'1')
            conn.query("UPDATE employee a inner join user b on a.empId=b.empId \n" +
                "SET\n"+
                "a.empNIK = ?,\n" +
                "a.empName = ?,\n" +
                "a.empAddress = ?,\n" +
                "a.empGender = ?,\n" +
                "a.empTmptLahir = ?,\n" +
                "a.empTglLahir = ?,\n" +
                "a.empAgama = ?,\n" +
                "a.empMaritalStatus = ?,\n" +
                "a.empGolDarah = ?,\n" +
                "a.empJabatan = ?,\n" +
                "a.deptId = ?\n" +
                "WHERE b.username = ?",
                [nik,name,address,gender,tmptLahir,tglLahir,agama,marital,golDarah,jabatan,deptId,username],
                function (error, result, fields) {
                    if (error) {
                        console.log("ERROR 1", error)
                        return res.status(400).json({
                            status: 400,
                            response: {
                                status: "error",
                                message: error.message
                            }
                        })
                    }
                    console.log("cek update 1 ",result)
                    if (result) {
                        try {
                            console.log("Try1")
                            conn.query("UPDATE user SET username =?, password =? WHERE empId =?",
                                [username,password,req.params.id],
                                function (error,resut,fields){
                                    if (error){
                                        console.log("ERROR-USER" ,error)
                                        return res.status(400).json({
                                            status: 400,
                                            response: {
                                                status: "error",
                                                message: error.message
                                            }
                                        })
                                    }
                                    return res.status(200).json({
                                        status: 200,
                                        response: {
                                            status: "success",
                                            message: "Success Edit Data"
                                        }
                                    })
                                })
                        } catch (err) {
                            console.log("ERROR CATCH 1", err.message)
                            return res.status(400).json({
                                status: 400,
                                response: {
                                    status: "error",
                                    message: err.message
                                }
                            })
                        }
                    }
                })
        } catch (err) {
            console.log("ERROR CATCH 2", err.message)
            return res.status(400).json({
                status: 400,
                response: {
                    status: "error",
                    message: err.message
                }
            })
        }
    }
    else {
        try {
            console.log("Try2")
            conn.query("SELECT username from user where empId=? ",[req.params.id],
                function (error,result,fields) {
                    if (error){
                        console.log("ERROR-USER" ,error)
                        return res.status(400).json({
                            status: 400,
                            response: {
                                status: "error",
                                message: error
                            }
                        })
                    }
                    if (result.length>0){
                        if (dataLogin.username==result[0].username){
                            try {
                                conn.query("UPDATE employee\n" +
                                    "SET\n"+
                                    "empNIK = ?,\n" +
                                    "empName = ?,\n" +
                                    "empAddress = ?,\n" +
                                    "empGender = ?,\n" +
                                    "empTmptLahir = ?,\n" +
                                    "empTglLahir = ?,\n" +
                                    "empAgama = ?,\n" +
                                    "empMaritalStatus = ?,\n" +
                                    "empGolDarah = ?,\n" +
                                    "empJabatan = ?,\n" +
                                    "deptId = ?\n" +
                                    "WHERE empId = ?",
                                    [nik,name,address,gender,tmptLahir,tglLahir,agama,marital,golDarah,jabatan,deptId,req.params.id],
                                    function (error, result, fields) {
                                        if (error) {
                                            console.log("ERROR 3", error)
                                            return res.status(400).json({
                                                status: 400,
                                                response: {
                                                    status: "error",
                                                    message: error.message
                                                }
                                            })
                                        }
                                        if (result) {
                                            try {
                                                console.log("TRY 4")
                                                conn.query("UPDATE user SET username = ?, password = ? WHERE empId =?",
                                                    [username,password,req.params.id],
                                                    function (error,resut,fields){
                                                        if (error){
                                                            console.log("ERROR-USER" ,error)
                                                            return res.status(400).json({
                                                                status: 400,
                                                                response: {
                                                                    status: "error",
                                                                    message: error.message
                                                                }
                                                            })
                                                        }
                                                        return res.status(200).json({
                                                            status: 200,
                                                            response: {
                                                                status: "success",
                                                                message: "Success Edit Data"
                                                            }
                                                        })
                                                    })
                                            } catch (err) {
                                                console.log("ERROR CATCH 6", err)
                                                return res.status(400).json({
                                                    status: 400,
                                                    response: {
                                                        status: "error",
                                                        message: err.message
                                                    }
                                                })
                                            }
                                        }
                                    })
                            } catch (err) {
                                console.log("ERROR CATCH 7", err)
                                return res.status(400).json({
                                    status: 400,
                                    response: {
                                        status: "error",
                                        message: err.message
                                    }
                                })
                            }
                        } else {
                            unAuthorizedRes(res)
                        }
                    }
                })

        } catch (err){
            console.log("ERROR CATCH 8", err)
            return res.status(400).json({
                status: 400,
                response: {
                    status: "error",
                    message: err.message
                }
            })
        }
    }
})

router.delete('/users/delete/:id',jwtAuth,(dataLogin,req,res,next)=>{
    const {nik,name,address,gender,tmptLahir,tglLahir,agama,marital,golDarah,jabatan,deptId,
        username,password,roleId}=req.body

    if (dataLogin.role === 1) {
        try {
            conn.query("UPDATE employee a inner join user b on a.empId=b.empId set a.empStatus=? where b.username=?",
                ['0',req.params.id],
                function (error, result, fields) {
                    if (error) {
                        console.log("ERROR", error)
                        return res.status(400).json({
                            status: 400,
                            response: {
                                status: "error",
                                message: error
                            }
                        })
                    }
                    if (result) {
                        try {
                            conn.query("UPDATE user SET status = ? WHERE empId=?",
                                ['0',req.params.id],
                                function (error,result,fields){
                                    if (error){
                                        console.log("ERROR-USER" ,error)
                                        return res.status(400).json({
                                            status: 400,
                                            response: {
                                                status: "error",
                                                message: error
                                            }
                                        })
                                    }
                                    return res.status(200).json({
                                        status: 200,
                                        response: {
                                            status: "success",
                                            message: "Success Delete Data"
                                        }
                                    })
                                })
                        } catch (err) {
                            console.log("ERROR CATCH ", err)
                            return res.status(400).json({
                                status: 400,
                                response: {
                                    status: "error",
                                    message: err
                                }
                            })
                        }
                    }
                })
        } catch (err) {
            console.log("ERROR CATCH ", err)
            return res.status(400).json({
                status: 400,
                response: {
                    status: "error",
                    message: err
                }
            })
        }
    } else {
        unAuthorizedRes(res)
    }
})

module.exports = router
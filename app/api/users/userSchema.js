const Joi = require('joi');

const registrationSchema = data => {
    const schema = {
        email: Joi.string().email().max(100).required(),
        password: Joi.string().required(),
        name: Joi.string(),
        noHp: Joi.string(),
        tempatLahir: Joi.string(),
        tglLahir: Joi.string(),
        alamat: Joi.string(),
        role: Joi.string(),
        // status: Joi.string().required(),
    };
    return Joi.validate(data, schema);
};

const loginSchema = data => {
    const schema = {
        email: Joi.string().email().max(100).required(),
        password: Joi.string().required(),
    };
    return Joi.validate(data,schema);
}

module.exports.registrationSchema=registrationSchema;
module.exports.loginSchema=loginSchema;
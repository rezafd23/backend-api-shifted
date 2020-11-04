const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate');


const userSchema = new Schema({
    email:{type:String,required:true},
    name:{type:String},
    password:{type:String,required:true},
    noHp:{type:String},
    tempatLahir:{type:String},
    tglLahir:{type:String},
    alamat:{type:String},
    role:{type:String},
    status:{type:String},
});
userSchema.plugin(mongoosePaginate)

module.exports=mongoose.model('user',userSchema);
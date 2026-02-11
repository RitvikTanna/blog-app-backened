import { strict } from 'assert';
import {Schema,model} from 'monogoose';
import {userRouter} from '../APIS/userapi.js';
import {authorRouter} from '../APIS/authorapi.js';
import {adminRouter} from '../APIS/adminapi.js';
config();

//create user schema


const userSchema= new Schema({
    FirstName:{
        type:String,
        required:[true,'First name is required']
    },

    LastName:{
        type:String,
    },

    email:{
        type:String,
        required:[true,'Email is required'],
    },

    Password:{
        type:String,
        required:[true,'Password is required'],
    },

    profileImageUrl:{
        type:String,
    },
    role:{
        type:String,
        enum:['author','user','admin'],
        required:[true,'{Value} is an Invalid Role']
    },

    isActive:{
        type:Boolean,
        default:true
    }
},
{
    timestamps:true,
    strict:true,
    versionKey:false

})


//create user model
const UserTypeModel=model('user',userSchema)

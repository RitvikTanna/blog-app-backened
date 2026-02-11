import {Schema,model} from 'mongoose';

//create user comment schema
const userCommentSchema=new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'user',
    },
    comment:{
        type:String,
    }
})

//create article schema 
const articleSchema=new Schema({
    author:{
        type:Schema.Types.ObjectId,
        ref:'user' ,
        required:[true,'Author is required'] 
    },
    title:{
        type:String,
        required:[true,'Title is required']
    },
    category:{
        type:String,
        required:[true,'Category is required']
    },
    content:{
        type:String,
        required:[true,'Content is required']
    },
    comments :[userCommentSchema],
    isArticleActive:{
        type:Boolean,
        default:true}
},{
    timestamps:true,
    strict:true,
    versionKey:false

})
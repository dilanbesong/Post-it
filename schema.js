const { model, Schema } = require('mongoose')
const { generateRandomAvatar } = require('./avatar')


const userSchema = new Schema({
   name:String,

   email:{
     type:String,
     require:true
   },
   password:String,
   avatar:{
     type:String,
   },

}) 
const deletedUserSchema = new Schema({
      deletedUser:String
})

const deletedPostSchema = new Schema({
    deletedPost:String
})

const deletedCommentSchema = new Schema({
    deletedComment:String,
})

const commentSchema = new Schema({
   commentorId:String,
   commentText:String,
   replies:Array
})

const postSchema = new Schema({
  userId:String,
  text:String,
  isDeleted:{ type:Boolean, default:false },
  postComments:Array,
  createdAt: { type:Date, default:Date.now }
})


const User = model('Users', userSchema)
const Post = model('posts', postSchema)
const Comment = model( 'comment', commentSchema)
const softUsers = model('softduser', deletedUserSchema)
const softPosts = model('softpost', deletedPostSchema)
const softComments = model('softcomment', deletedCommentSchema)

module.exports = { User, Post, Comment, softUsers, softPosts, softComments }

// {
    // "name":"Dilan",
    // "email":"dilan@gmail.com",
    // "password":"1234"
// }
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
const { User, Post, Comment, softUsers, softPosts, softComments } = require('./schema')
const flash = require('express-flash')
const session = require('express-session')
const jwt = require('jsonwebtoken')
const { generateRandomAvatar } = require('./avatar')
require('dotenv').config()
const path = require('path')
const { timeAgo } = require('./timeAgo')
const app = express()
const _path = path.resolve(__dirname, 'public')
const port = process.env.PORT || 3000
app.use(express.static(_path))
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(flash())
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Post-it'
mongoose.connect(MONGO_URI)
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri:MONGO_URI,
  collection: 'sessions'
});
app.use(session({
  secret:'hfiut5tkhjtoi6puo',
  saveUninitialized:false,
  resave:false,
  store
}))
//app.use(express.json())
app.use(cors())
//---------------------------Authentication of users............................//
app.post('/signUp', userExist, async(req, res) => {
  const { email } = req.body
  const { image } = await generateRandomAvatar(email)
  const newUser = new User({...req.body, avatar:image})
  req.session.user = newUser
  req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 365
  req.session.cookie.expires = false
  req.session.isAuth = true
  await newUser.save()
   return res.send(newUser)
})
app.delete('/delete-account', async( req, res ) => {
   deleteUser(req.session.user._id, res)
})

app.put( '/update-account', async(req, res) => {
   const userId = req.session.user._id
   const { name, email, password } = req.body
  const updatedUser = await User.findByIdAndUpdate(userId, {...req.session.user, 
   name, email, password, image:generateRandomAvatar(email) })
  
  if(updatedUser !== null){
    return res.json({updatedUser})
  }
  return res.json({ msg: 'we could not update this user'})
})

app.post('/login', async (req, res) => {
   const { email, password } = req.body
   const user = await User.findOne({email})
   if( user !== null && user.password === password){
      req.session.user = user
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 365
      req.session.cookie.expires = false
      req.session.isAuth = true
      return res.json({msg:'user successfully logged in :) '})
   }
   return res.json({msg:'Incorrect email or password :( '})
})

//http://localhost:3000/findUser?name=queryString
app.get('/finduser', async (req, res) => {
   const { name } = req.query
   //const searchedUser = await User.find({name}).sort({name:1})
   const users = await User.find()
   const searchedUser = users.filter( user => {
      return user.name.includes(name)
   })
   if( await User.countDocuments() >= 1){
     return res.send(searchedUser)
   }
   return res.json({msg: `We could not find ${ name }`})
})


//-----------------------creation of post ------------------------------------------//

app.post('/createpost', async (req, res) => {
   const {  text } = req.body
   const newPost = new  Post({ userId:req.session.user._id, text })
   await newPost.save()
   return res.json({newPost})
})

//http://localhost:3000/deletePost?postId=queryString
app.delete('/deletePost', async (req, res) => {
    const { postId } = req.query
    const post = await Post.findById(postId)
    await Post.findByIdAndUpdate(postId, {isDeleted:true})
    const softpost =  new softPosts({ deletedPost:JSON.stringify(post) })
    await softpost.save()
    return res.json({msg:'post have been deleted', deletedPost:softposts })
})

//http://localhost:3000/getPost  fetches all post from DB
app.get('/getPosts', async(req, res) => {
    const posts = await Post.find()
    const recentPost = posts.map( post =>{
       return { ...post, timeAgo:timeAgo(new Date(post.createdAt.toString())) }
    })
  
   return res.send(recentPost)
})

app.get('/post/:postId', async(req, res) => {
   const { postId } = req.params
   const post = await Post.findById(postId)
   return res.send(post)
})
//http://localhost:3000/searchPost?searchword=queryString
app.get('/searchPost', async(req, res) => {
    const { searchword } = req.query
    if( searchword == '') return
     const posts = await Post.find()
     const searchPost = posts.filter( post => {
       return post.userId.toLocaleLowerCase().startsWith(searchword) || post.text.toLocaleLowerCase().startsWith(searchword)
     })
     return res.send(searchPost)

})
//http://localhost:3000/findUser?postId=queryString&postText=queryString
app.get('/editPost', async(req, res) => {
  const { postId, postText } = req.query
  const getPost = await Post.findById(postId)
  if( getPost.userId == req.session.user._id){
   const editedPost = await Post.findByIdAndUpdate(postId, { text:postText })
   return res.send(editedPost)
  }
  return res.send({msg:'You cannot edit this post'})
})


//--------------------------Comment-section -------------------------------------
 

// parent comment
app.post('/maincomment', async(req, res) => {
   const { commentText, postId } = req.body
   const getPost = await Post.findById(postId)
   if(getPost !== null){
      const newComment = new Comment({ commentorId:req.session.user._id, commentText })
      await newComment.save()
      const commentedPost = await Post.updateOne({_id:postId}, {$push:{postComments:newComment._id}})
      return res.json({commentedPost})
   }
   return res.json({msg:'No post with this id'})

})


//http://localhost:3000/searchcomment?commentorsId=queryString&postId=queryString
app.get('/searchcomment', async(req, res) => {
   const { commentorsId, postId } = req.query
   const post = await Post.findById(postId)
   const searchComment = await Promise.all(post.postComments.map( async (commentId) => {
      let comment = await Comment.findById(commentId)
      if( comment == null) {
         await Post.updateOne({_id:postId}, { $pull:{postComments:commentId} })
      }
      return comment.commentorId.includes(commentorsId)
   }))
   return res.send(searchComment)
})

// show post and full comments
app.get('/comment/:postId', async (req, res) => {
   const { postId } = req.params
   const {  postComments } = await Post.findById(postId)
   const getComments = await Promise.all( await postComments.map(async (commentId) => {
      let comment = await Comment.find({_id:commentId})
      if( comment == null){
         await Post.updateOne({_id:commentId}, {$pull:{postComments:commentId}})
      }
      return comment
   }))

   return res.send(getComments.flat(1))
})

// edit comment
app.put('/editComment', async(req, res) => {
   const { commentId, commentText } = req.body
   const { commentorId } = await Comment.findById(commentId)
   if( commentorId !== req.session.user._id.toString() ){
   return res.send({msg:'Unauthorize to make changes'})
   }
   await Comment.findByIdAndUpdate( commentId, { commentText })
   return res.send({ msg:'comment has been updated' })
})

// delete comment
app.delete( '/deleteComment', async (req, res) => {
   const { commentId, postId } = req.body
   const getComment = await Comment.findById(commentId)
   const post = await Post.findById(postId)
   
   if(getComment.commentorId !== req.session.user._id.toString()){
      return res.send({msg:'You cannot delete this comment'})
   }
   const softcomment = new softComments({deletedComment:getComment})
   await softcomment.save()
   await Comment.findByIdAndDelete(commentId)
   await Post.updateOne({_id:postId}, {$pull:{postComments:commentId}} )
   return res.send({msg:'comment has been deleted..'})
})

//---------------------subcomment------------------------------------------

// create replies/sub comments
app.post('/subcomment', async (req, res) => {
    const { commentId, replyText } = req.body
    const subcomment = new Comment({ commentorId:req.session.user._id, commentText:replyText })
    await subcomment.save()
    const childcomment = await Comment.updateOne({_id:commentId}, { $push:{replies:subcomment._id } })
    return res.send(childcomment)
      
})
//https:localhost:3000/displayreplies?commentId=queryString
app.get('/displayreplies', async (req, res) => {
   const { commentId } = req.query
   const { replies } = await Comment.findById(commentId)
   if(replies.length <= 0){
      return res.send({msg:'Zero reaction for this comment '})
   }
   const getReplies = await Promise.all( replies.map( async (replyId) => {
         let reply = await Comment.findById(replyId)
         return reply
   }))
   return res.send(getReplies.flat(1))

})

app.delete('/deletereply', async (req, res) => {
   const { commentId, replyId } = req.body
   const reply = await Comment.findById(replyId)
   if(reply.commentorId !== req.session.user._id){
      return res.send({msg:'You cannot delete this reply'})
   }
   await Comment.updateOne({_id:commentId}, {$pull:{replies: replyId}})
   await new softComments({}).save({deletedComment:JSON.stringify(reply)})
   await Comment.findByIdAndDelete(replyId)
   return res.send({ msg:'reply successfull deleted'})
})


async function userExist(req, res, next){
  const { email } = req.body
  const user = await User.findOne({email})
  if(user !== null){
     return res.json({ msg:'user already exist!'})
  }
  return next()
}

async function deleteUser(userId, res){
   const deletedUser = await User.findByIdAndDelete(userId)
   await new softUsers({deletedUser:JSON.stringify(deletedUser)}).save()
  

  if( deletedUser !== null){
     return res.json({ msg: 'user has been deleted'})
  }
     return res.json({ msg: 'we could not delete this user'})
}

///-------------------------------Admin-panel-----------------------------//
// This routes should be kept secrete
app.delete('/admin/deleteuser', async (req, res) => {
   deleteUser(req.body.userId, res)
})

app.put('/admin/edituser', async (req, res) => {
  try {
     const { userId,  usermail, name, password } = req.body
     const results = await User.updateOne({_id:userId}, {$set:{ name, password, email:usermail, 
       avatar: await generateRandomAvatar(usermail).image}})
     return res.send(JSON.stringify(results))
  } catch (error) {
     return res.send(error.message)
  }
})


app.listen(port, () => console.log(`Server is running on port ${port}...`))
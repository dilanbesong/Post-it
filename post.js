const express = require('express')
const {  Post, softPosts } = require('./schema')
const { timeAgo } = require('./timeAgo')
const router = express.Router()
const bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({extended:false}))
router.use(bodyParser.json())

router.post('/createpost', async (req, res) => {
   try {
      const {  text } = req.body
      const newPost = new  Post({ userId:req.session.user._id, text })
      await newPost.save()
      return res.json({newPost})
   } catch (error) {
       return res.send(error.message)
   }
   
})

// delete post
router.delete('/deletePost', async (req, res) => {
   try {
        const { postId } = req.body
        const post = await Post.findById(postId)
        await Post.findByIdAndDelete(postId)
        const softpost =  new softPosts({ deletedPost:JSON.stringify(post) })
        await softpost.save()
        return res.json({msg:`post with id ${post._id} have been deleted` })
   } catch (error) {
      return res.send(error.message)
   }
})

//http://localhost:3000/getPosts  fetches all post from DB
router.get('/getPosts', async(req, res) => {
     try {
            const posts = await Post.find()
            const recentPost = posts.map( post =>{
               return { ...post, timeAgo:timeAgo(new Date(post.createdAt.toString())) }
             })
      return res.send(recentPost)
     } catch (error) {
      return res.send(error.message)
     }
})
//
router.get('/post/:postId', async(req, res) => {
   try {
      const { postId } = req.params
      const post = await Post.findById(postId)
      return res.send(post)
   } catch (error) {
      return res.send(error.message)
   }
})
//http://localhost:3000/searchPost?searchword=queryString
router.get('/searchPost', async(req, res) => {
    try {
       const { searchword } = req.query
      if( searchword == '') return
      const posts = await Post.find()
      const searchPost = posts.filter( post => {
          return post.userId.toString().toLocaleLowerCase().startsWith(searchword)
             || post.text.toLocaleLowerCase().startsWith(searchword) 
            || post._id.toString().startsWith(searchword)
     })
        return res.send(searchPost)
    } catch (error) {
      return res.send(error.message)
    }
})
//http://localhost:3000/findUser?postId=queryString&postText=queryString
router.get('/editPost', async(req, res) => {
  try {
      const { postId, postText } = req.query
      const getPost = await Post.findById(postId)
     if( getPost.userId == req.session.user._id.toString()){
         const editedPost = await Post.findByIdAndUpdate(postId, { text:postText })
        return res.send(editedPost)
      }
     return res.send({msg:'You cannot edit this post'})
  } catch (error) {
    return res.send(error.message)
  }
})

module.exports = router

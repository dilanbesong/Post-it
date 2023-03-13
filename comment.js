
const express = require('express')
const router = express.Router()
const {  Post, Comment, softComments } = require('./schema')
const bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({extended:false}))
router.use(bodyParser.json())

router.post('/maincomment', async(req, res) => {
   try {
       const { commentText, postId } = req.body
       const getPost = await Post.findById(postId)
       if(getPost !== null){
          const newComment = new Comment({ commentorId:req.session.user._id, commentText })
          await newComment.save()
          const commentedPost = await Post.updateOne({_id:postId}, {$push:{postComments:newComment._id}})
         return res.json({commentedPost})
       }
       return res.json({msg:'No post with this id'})
   } catch (error) {
      return res.send(error.message)
   }

})


//http://localhost:3000/searchcomment?commentorId=queryString&postId=queryString
router.get('/searchcomment', async(req, res) => {
   try {
          const {commentorId, postId } = req.query
          const post = await Post.findById(postId)
          const specificPostcomment = await Comment.find({ '_id': {$in:post.postComments}})
          const searchcomment = specificPostcomment.filter( comment => { 
           return comment.commentorId.toString().includes(commentorId) 
         })
          return res.send(searchcomment)
      } catch (error) {
           return res.send(error.message)
       }
})

// show post and full comments
router.get('/comment/:postId', async (req, res) => {
   try {
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

   } catch (error) {
      return res.send(error.message)
   }
   
})

// edit comment
router.put('/editComment', async(req, res) => {
   const { commentId, commentText } = req.body
   const { commentorId } = await Comment.findById(commentId)
   if( commentorId !== req.session.user._id.toString() ){
   return res.send({msg:'Unauthorize to make changes'})
   }
   await Comment.findByIdAndUpdate( commentId, { commentText })
   return res.send({ msg:'comment has been updated' })
})

// delete comment
router.delete( '/deleteComment', async (req, res) => {
   try {
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
   } catch (error) {
      return res.send(error.message)
   }
})
module.exports = router
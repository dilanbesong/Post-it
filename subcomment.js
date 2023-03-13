const express = require('express')
const router = express.Router()
const {  Comment,  softComments } = require('./schema')
const bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({extended:false}))
router.use(bodyParser.json())

router.post('/subcomment', async (req, res) => {
   try {
       const { commentId, replyText } = req.body
      const subcomment = new Comment({ commentorId:req.session.user._id, commentText:replyText })
      await subcomment.save()
      const childcomment = await Comment.updateOne({_id:commentId}, { $push:{replies:subcomment._id } })
      return res.send(childcomment)
   } catch (error) {
      return res.send(error.message)
   } 
      
})
//http://localhost:3000/displayreplies?commentId=queryString
router.get('/displayreplies', async (req, res) => {
    try {
         const { commentId } = req.query
         const { replies } = await Comment.findById(commentId)

        if(replies.length <= 0){
          return res.send({msg:'Zero reaction for this comment '})
       }
       const getReplies = await Comment.find({'_id':{$in:replies}})
       return res.send(getReplies)

    } catch (error) {
      return res.send(error.message)
    }
})

router.delete('/deletereply', async (req, res) => {
   try {
         const { commentId, replyId } = req.body
         const reply = await Comment.findById(replyId)
        if(reply.commentorId !== req.session.user._id.toString()){
           return res.send({msg:'You cannot delete this reply'})
        }
           await Comment.updateOne({_id:commentId}, {$pull:{replies: replyId}})
           await new softComments({deletedComment:JSON.stringify(reply)})
           .save({deletedComment:JSON.stringify(reply)})
           await Comment.findByIdAndDelete(replyId)
           return res.send({ msg:'reply successfull deleted'})
   } catch (error) {
       return res.send(error.message)
   }
})
module.exports = router

const express = require('express')
const { deleteUser } = require('./method')
const { User } = require('./schema')
const router = express.Router()
const bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({extended:false}))
router.use(bodyParser.json())

///-------------------------------Admin-panel-----------------------------//
// This routes should be kept secrete
router.delete('/admin/deleteuser', async (req, res) => {
   deleteUser(req.body.userId, res)
})

router.put('/admin/edituser', async (req, res) => {
  try {
     const { userId,  usermail, name, password } = req.body
     const results = await User.updateOne({_id:userId}, {$set:{ name, password, email:usermail, 
       avatar: await generateRandomAvatar(usermail).image}})
     return res.send(JSON.stringify(results))
  } catch (error) {
     return res.send(error.message)
  }
})

module.exports = router
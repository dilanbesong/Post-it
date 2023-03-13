const express = require('express')
const { generateRandomAvatar } = require('./avatar')
const { User } = require('./schema')
const bodyParser = require('body-parser')
const { deleteUser, userExist } = require('./method')
const router = express.Router()
router.use(bodyParser.urlencoded({extended:false}))
router.use(bodyParser.json())
const session = require('express-session')
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Post-it'
require('dotenv').config()
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
  uri:MONGO_URI,
  collection: 'sessions'
});
router.use(session({
  secret:process.env.SESSION_SECRETE,
  saveUninitialized:false,
  resave:false,
  store
}))


router.post('/signUp', userExist, async(req, res) => {
      try {
          const { email } = req.body
          const { image } = await generateRandomAvatar(email)
          const newUser = new User({...req.body, avatar:image})
          req.session.user = newUser
          req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 365
          req.session.cookie.expires = false
          req.session.isAuth = true
         await newUser.save()
         return res.send(newUser)
      } catch (error) {
         return res.send(error.message)
      }
})
router.delete('/delete-account', async( req, res ) => {
   try {
     deleteUser(req.session.user._id, res)
   } catch (error) {
     return res.send(error.message)
   }
})

router.put('/update-account', async(req, res) => {
  try {
      const userId = req.session.user._id
      const { name, email, password } = req.body
      const updatedUser = await User.findByIdAndUpdate(userId, {...req.session.user,
      name, email, password, image:generateRandomAvatar(email) })
  
     if(updatedUser !== null){
        return res.json({updatedUser})
     }
    return res.json({ msg: 'we could not update this user'})
  } catch (error) {
     return res.send(error.message)
  }
})

router.post('/login', async (req, res) => {
   try {
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
   } catch (error) {
      return res.send(error.message)
   }
   
})

//http://localhost:3000/findUser?name=queryString
router.get('/finduser', async (req, res) => {
  try {
      const { name } = req.query
      const users = await User.find()
      const searchedUser = users.filter( user => {
      return user.name.toLowerCase().includes(name)
    })
      if( await User.countDocuments() >= 1){
        return res.send(searchedUser)
      }
      return res.send({msg: `We could not find ${ name }`})
  } catch (error) {
    return res.send(error.message)
  }
})

// http:localhost:3000/user/:userId
// Get user by id
router.get('/user/:userId', async(req, res) => {
  const { userId } = req.params
    try {
       const user = await User.findById(userId)
       if(user == null){
         return res.send({msg:"This user does not exist"})
       }
        return res.send(user)
    } catch (error) {
      return res.send(error.message)
    }
})

module.exports = router
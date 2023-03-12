const { User,  softUsers } = require('./schema')


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

module.exports = { userExist, deleteUser }

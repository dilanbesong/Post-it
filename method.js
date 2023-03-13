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
   const softuser =  new softUsers({deletedUser:JSON.stringify(deletedUser)})
   await softuser.save()
  

  if( deletedUser !== null){
     return res.json({ msg: 'we could not delete this user'})
  }
     return res.json({ msg: 'user has been deleted'})
}

module.exports = { userExist, deleteUser }

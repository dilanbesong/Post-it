const express = require('express')
const mongoose = require('mongoose')
const { generateRandomAvatar } = require('./avatar')
const cors = require('cors')
const flash = require('express-flash')
const auth = require('./auth')
const admin = require('./admin')
const comment = require('./comment')
const post = require('./post')
const subcomment = require('./subcomment')
const app = express()
const port = process.env.PORT || 3000
app.use(flash())
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/Post-it'
mongoose.connect(MONGO_URI)

app.use(cors())
app.use(auth)
app.use(post)
app.use(comment)
app.use(subcomment)
app.use(admin)

//Task #one
generateRandomAvatar('yourmail@gmail.com').then( ({ image }) => {
      console.log(image)            
}).catch( err => console.log(err.message))


app.listen(port, () => console.log(`Server is running on port ${port}...`))
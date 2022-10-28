const express = require('express')
const app = express()
const cors = require('cors')
var bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'))

mongoose.connect(process.env.MONGO);

const User = mongoose.model('User', { name: String });
const Exercise = mongoose.model('Exercise', { description: String, duration: Number, date: Date, user: String });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async function (req, res) {
  res.json(await (await User.find({})).map(user => {return { _id: user._id, username: user.name }}))
})

app.get('/api/users/:_id/logs', async function (req, res) {
  const userId = req.params._id

  const limit = req.query.limit || 10000
  const from = req.query.from ? new Date(req.query.from) : new Date(0)
  const to = req.query.to ? new Date(req.query.to) : new Date()

  
  const user = await User.findById(userId)
  const exercises = await Exercise.find({ user: userId, date: {$gte: from, $lte: to} }).limit(limit)

  res.json({ _id: userId, username: user.name, count: exercises.length, log: exercises.map(exercise => {return { description: exercise.description, duration: exercise.duration, date: exercise.date.toDateString() }}) })
})

app.post('/api/users', function (req, res) {
  const username = req.body.username

  const user = new User({ name: username })
  user.save()

  res.json({ _id: user._id, username: username })
})

app.post('/api/users/:_id/exercises', async function (req, res) {
  const userId = req.params._id

  const description = req.body.description
  const duration = req.body.duration
  const date = req.body.date ? new Date(req.body.date) : new Date()

  const exercise = new Exercise({ description: description, duration: duration, date: date, user: userId })
  exercise.save()

  const user = await User.findById(userId)

  res.json({ _id: user._id, username: user.name, date: exercise.date.toDateString(), duration: parseFloat(duration), description: description })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

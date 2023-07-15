const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose  = require('mongoose');

const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const secret = 'supersecret';

//def mongoose schemas(data's shape)
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
}); 

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String, 
  price: Number, 
  imageLink: String, 
  published: Boolean
});

//def mogoose models
const User =  mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

const authenticateJwt = (req, res, next) => {
  const authHeader = req.header.authorization;

  if(authHeader) {
    const token = authHeader.split(' ');
    jwt.verify(token, secret, (err, user) => {
      if(err){
        return res.sendStatus(403);
      } 
        req.user = user;
        next();
    });
  }
  else{
    res.sendStatus(401);
  }
}

mongoose.connect('mongodb+srv://guest6125:a4KjevqZDayvAS3O@cluster0.qib9zxg.mongodb.net/courses', { useNewUrlParser: true, useUnifiedTopology: true, dbName: "courses" });

// Admin routes
app.post('/admin/signup', async (req, res) => {
  // logic to sign up admin
  const { username, password } = req.body; 
  const admin = await Admin.findOne({ username }); //await is similar to a promise calling a callback function  

  if(admin){
    res.status(403).json({ message: 'Admin already exists' });
  } else {
    const newAdmin =  new Admin({ username, password }); //class with object inputs 
    await newAdmin.save(); //saves to database 
    const token = jwt.sign({ username, role: 'Admin' }, secret, { expiresIn: '1h'});
    res.json({ message: 'Admin created sucessfully ', token }); 
  }
});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  const admin =  await Admin.findOne({ username, password });

  if(admin) {
    const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '1h' });
    res.json({ message: 'Logged in sucessfully ', token });
  } else {
    res.status(403).json({ message: 'Invalid username or password '});
  }
});

app.post('/admin/courses', authenticateJwt, async (req, res) => {
  // logic to create a course
   const course = new Course(req.body);
   await course.save();
   res.json({ message: 'Course created sucessfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', authenticateJwt, async  (req, res) => {
  // logic to edit a course
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
  if(course) {
    res.json({ message: 'Course updated' });
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/admin/courses', async (req, res) => {
  // logic to get all courses
  const course = await Course.find({});
  res.json({ course }); 
});

// User routes
app.post('/users/signup', async(req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if(user){
    res.status(403).json({ message: 'User Already exists'});
  } else {
    const newUser = new User({ username, password });
    await newUser.save();
    const token = jwt.sign({ username, role: 'user' }, secret, { expiresIn: '1hr'});
    res.json({ message: 'User has been made', token }); 
  }
  });

app.post('/users/login', async (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  const user = await User.findOne({ username, password });
  if(user){
    const token = jwt.sign({ username, role: 'role' }, secret, {expiresIn: '1hr'});
    res.json({ message: 'Logged in sucessfully', token });
  } else {
    res.status(403).json({ message: 'Invalid username or password '});
  }
});

app.get('/users/courses', authenticateJwt, async (req, res) => {
  // logic to list all courses
  const course = await Course.find({published: true});
  res.json({ course });
});

app.post('/users/courses/:courseId', authenticateJwt, async (req, res) => {
  // logic to purchase a course
  const course = await Course.findById(req.params.courseId);
  if(course) {
    const user = await User.findOne({ username: req.user.username });
    if (user){
      user.purchasedCourses.push(course);
      await user.save();
      res.json({ message: 'Course has been brought'});
    } else {
      res.status(403).json({ message: 'User not found'});
    }
  } else {
    res.status(404).json({ message: 'Course not found' });
  }  
});

app.get('/users/purchasedCourses', authenticateJwt, async (req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({ username: req.user.username }).populate('purchasedCourses')
  if(user){
    res.json({ purchasedCourses: user.purchasedCourses || []});
  } else {
    res.status(403).json({ message: 'User not found' });
  }  
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

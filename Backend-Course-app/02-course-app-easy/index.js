const express = require('express');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

//.json() // turns plain text into json  

//adminAuthentication 
const adminAuthentication = (req, res, next) => {
  const { username, password } = req.headers;//user and passwords is stored in headers

  const admin = ADMINS.find(a => a.username === username && a.password === password);
  if (admin){
    next();
  } else {
    res.status(403).json({ message: 'Admin authentication failed'});
  }
};

const userAuthentication = (req, res, next) => {
  const { username, password } = req.headers;

  const user = USERS.find(u => u.username === username && u.password === password);

  if(user){
    req.user = user;
    next();
  } else {
    res.status(403).json({ message: 'User authentication failed'}); 
  }
}; 

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body 
  //requests the body 
  const existingAdmin = ADMINS.find(a => a.username === admin. username);
  //Check if new admin is already made in the ADMINS array 
  if(existingAdmin){
    res.status(403).json({message: 'Admin already exists'});
  } else {
    ADMINS.push(admin);//adds admin to ADMINS array
    res.json({ message: 'Admin created successfully'});
  }
  });

app.post('/admin/login', adminAuthentication, (req, res) => { //middleware to post funcation
  // logic to log in admin
  //if adminAuthentication passes the admin can login 
  res.json({ message: 'Logged in successfully'});

});

app.post('/admin/courses', adminAuthentication, (req, res) => {
  // logic to create a course
  const course = req.body;// a request of the current courses 

  if(!course.title){
    return res.json(411).sendDate({'msg': 'Send Title !'});
  }
  course.id = Date.now(); //using time ad course id num
  COURSES.push(course); //add new course to COURSES array
  res.json({ message: 'Course created sucessfully', courseId : course.id});
});

app.put('/admin/courses/:courseId', adminAuthentication, (req, res) => {
  // logic to edit a course
  const courseId =  parseInt(req.params.courseId);//Casts courseId(SIMPLE TEXT) to integer 
  const course = COURSES.find(c => c.id === courseId); //Finds course with courseId in COURSES array
  if (course){
    Object.assign(course, req.body);// changes the body parms 
  res.json({ message: 'Course has been updated'}); 
  } else {
    res.status(404).json({message: 'Course not found'});
  }
});

app.get('/admin/courses', adminAuthentication, (req, res) => {
 // logic to get all courses
  res.json({ courses: COURSES}); 
});


// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = {
    username: req.body.username,
    password: req.body.password, 
    purchasedCourses: []
  }

  USERS.push(user);
  res.json({message: 'User has been made!'});
});

app.post('/users/login', userAuthentication, (req, res) => {
  // logic to log in user
  res.json({ message: 'Logged in sucessfully!'}); 
});

app.get('/users/courses', userAuthentication, (req, res) => {
  // logic to list all courses
  let filteredCourses = COURSES.filter(c => c.published);

  res.json({ courses: filteredCourses}); 
});

app.post('/users/courses/:courseId', userAuthentication, (req, res) => {
  // logic to purchase a course
  const courseId = Number(req.params.courseId);
  const course = COURSES.find(c => c.id === courseId && c.published === true);
  if (course) {
    req.user.purchasedCourses.push(courseId);
    res.json({ message: 'Course has been purchased'});
  } else {
    res.status(404).json({ message: 'Course not found or not available' });
  }
});

app.get('/users/purchasedCourses', userAuthentication, (req, res) => {
  // logic to view purchased courses
  var purchasedCoursesIds = req.user.purchasedCourses
  var purchasedCourses = COURSES.filter(c => purchasedCoursesIds.includes(c.id));
  res.json({ purchasedCourses }); 
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

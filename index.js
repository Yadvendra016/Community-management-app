import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import mongoose from 'mongoose';
import http from 'http';
// for socket.io
import { Server } from 'socket.io'; 
import formatMessage from './utils/messages.js';
import {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
  } from './utils/users.js';

// auathentication element of passport.js
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from'passport-local-mongoose';



const app = express();
mongoose.set('strictQuery', false);

// http connection
const server = http.createServer(app);
// socket.io connection
const io = new Server(server);



// passport authentication
app.use(session({   
    secret: "we are devRookies",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); 
app.use(passport.session());


//*****mongoose-connected to localdatabase but later on i connected it to atlas*******
mongoose.connect("mongodb://127.0.0.1:27017/upesDB",{useNewUrlParser: true});


// register/login user schema
const userSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    course:{
      type: String,
        required: true
    }

});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema );


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// home
app.get('/', (req,res) =>{
  res.render('home');
});

app.get('/about', (req,res) =>{
  res.render('about');
});

app.get('/teamChat', (req,res) =>{
  res.render('teamChat');
});

app.get('/teams', (req,res) =>{
  res.render('teams');
});

app.get('/registration', (req,res) =>{
  res.render('registration');
});

app.get('/login', (req,res) =>{
  res.render('login');
});
app.post("/registration", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/registration");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });

});
app.post("/login", function(req, res){

  const user = new User({
    username: req.body.email,
    password: req.body.password,
    
    

    
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });

});

io.on("connection", (socket) => {
    console.log(io.of("/").adapter);
    socket.on("joinRoom", ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
  
      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
  
      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
  
    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
  
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
  
    // Runs when client disconnects
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
  
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );
  
        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });
  

// listen port 
server.listen(4000, () => console.log("app is running at port 4000"));
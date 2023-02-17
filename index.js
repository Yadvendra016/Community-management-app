import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import mongoose from 'mongoose';
// auathentication element of passport.js
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from'passport-local-mongoose';


const app = express();
mongoose.set('strictQuery', false);


// passport authentication
app.use(session({   // LEVEL 5
    secret: "we are devRookies",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); 
app.use(passport.session());


//*****mongoose-connected to localdatabase but later on i connected it to atlas*******
mongoose.connect("mongodb://127.0.0.1:27017/upesDB",{useNewUrlParser: true});


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


// listen port 
app.listen(3000, () => console.log("app is running at port 3000"));
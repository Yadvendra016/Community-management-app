import express from 'express';
import bodyParser from 'body-parser';
import ejs from 'ejs';


const app = express();



app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// home
app.get('/', (req,res) =>{
  res.render('home');
});


// listen port 
app.listen(3000, () => console.log("app is running at port 3000"))
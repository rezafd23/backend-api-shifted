const express = require('express');
const bodyParser = require('body-parser');
const dbConfig = require('./config/database');
const mongoose = require('mongoose');
var cors = require('cors')
var http = require('http');
const hostname = "127.0.0.1"
const port = 3000



// create express app
const app = express();
const server = http.createServer(app)
app.use(cors())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// parse requests of content-type - application/json
app.use(bodyParser.json());

mongoose.connect(dbConfig.url, {
    useNewUrlParser: true,
    useUnifiedTopology:true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

app.use(express.json());
const UserControl = require('./app/api/users/userController');
const deptControl = require('./app/api/department/departmentController');

app.use('/app/api/user',UserControl )
app.use('/app/api/dept',deptControl )

server.listen(port, hostname, () => console.log("Server listening on port " + port))
// app.listen(3000, () => {
//     console.log("Server is listening on port 3000");
// });
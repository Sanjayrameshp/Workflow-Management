const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const userRoute = require('./routes/user');
const projectRoute = require('./routes/project')
const taskRoute = require('./routes/task')

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=> {
  console.log("DATABASE CONNECTED SUCCESSFULLY");
})
.catch((error)=> {
  console.log("DATABASE CONNECTION FAILED");
  console.log(error);
})


app.use('/expressapi/user', userRoute);
app.use('/expressapi/project', projectRoute);
app.use('/expressapi/task', taskRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> {
    console.log(`Server running on ${PORT}`);
})

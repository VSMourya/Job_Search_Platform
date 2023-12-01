const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection setup
// ...

app.post('/register', (req, res) => {
    // Handle registration logic
});

app.post('/login', (req, res) => {
    console.log("I AM HERE")
    // Handle login logic
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});

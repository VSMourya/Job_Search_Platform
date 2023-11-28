const express = require("express")
const app = express()

const mysql2 = require("mysql2")
const cors = require("cors")

app.use(cors())

const db = mysql2.createConnection({
    user:"root",
    host:"localhost",
    password: "12345678",
    database:"JobSearch"
})

db.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/create', (req, res) => {
    const { type, data } = req.body; // 'type' can be 'employer', 'candidate', or 'job'

    console.log("data==> :",data)
    if (type === 'Employers') {
        // const { employerId, EnterpriseName, Location, Address } = data;

        const EmployerId = data.employerId
        const EnterpriseName = data.enterpriseName
        const Location = data.location
        const Address = data.address
        const CEO = data.CEO

        const sqlInsert = "INSERT INTO employers (EmployerID, EnterpriseName, CEO, Location, Address) VALUES (?,?,?,?,?)";
        db.query(sqlInsert, [ EmployerId, EnterpriseName,CEO, Location, Address], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error while creating employee'+err.message);
            } else {
                res.status(201).send('Employee created successfully');
            }
        });

    } else if (type === 'Candidates') {
        // Assuming data contains { candidateId, qualification, experience }
        const { candidateId, qualification, experience } = data;
        const sqlInsert = "INSERT INTO candidates (candidateID, qualification, experience) VALUES (?, ?, ?)";
        db.query(sqlInsert, [candidateId, qualification, experience], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error while creating candidate');
            } else {
                res.status(201).send('Candidate created successfully');
            }
        });
    } else if (type === 'Jobs') {
        // Assuming data contains { jobId, jobDescription, salary, employerId }
        const { jobId, jobDescription, salary, employerId } = data;
        const sqlInsert = "INSERT INTO jobs (JobID, JobDescription, Salary, EmployerID) VALUES (?, ?, ?, ?)";
        db.query(sqlInsert, [jobId, jobDescription, salary, employerId], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error while creating job');
            } else {
                res.status(201).send('Job created successfully');
            }
        });
    } else {
        res.status(400).send('Invalid type specified');
    }
});
app.get('/employers', (req, res) => {
  db.query("SELECT * FROM Employers", (err, results) => {
    if (err) {
      console.error('Error fetching employers: ', err);
      res.status(500).send('Error fetching employers');
      return;
    }
    res.status(200).json(results);
  });
});

// Endpoint to get jobs
app.get('/jobs', (req, res) => {
  db.query("SELECT * FROM Jobs", (err, results) => {
    if (err) {
      console.error('Error fetching jobs: ', err);
      res.status(500).send('Error fetching jobs');
      return;
    }
    res.status(200).json(results);
  });
});

// Endpoint to get candidates
app.get('/candidates', (req, res) => {
  db.query("SELECT * FROM Candidates", (err, results) => {
    if (err) {
      console.error('Error fetching candidates: ', err);
      res.status(500).send('Error fetching candidates');
      return;
    }
    res.status(200).json(results);
  });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
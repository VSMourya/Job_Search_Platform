const express = require("express");
const mysql2 = require("mysql2");
const cors = require("cors");

const app = express();

// Database Connection
const db = mysql2.createConnection({
    user: "root",
    host: "localhost",
    password: "12345678",
    database: "JobPortal"
});

db.connect(function(err) {
    if (err) throw err;
    console.log("Connected to Database!");
});

// Middleware Configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/login', (req, res) => {
    const { UserID, UserPassword } = req.body;

    console.log("body ", UserID);
    
    const sqlSelect = "SELECT * FROM Users WHERE UserID = ?";
    db.query(sqlSelect, [UserID], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error while logging in');
        }
        if (result.length > 0) {
            console.log(result);
            if (UserPassword === result[0].UserPassword) {
                const UserType = result[0].UserType
                res.status(200).send({message:"Logged In",UserID: UserID,UserType:UserType});
            } else {
                res.status(401).send('Wrong username/password combination');
            }
            
        } else {
            res.status(404).send('User not found');
        }
    });
});

app.post('/register', (req, res) => {
    const { UserID, UserPassword, UserType } = req.body;

    // First insert the user
    const sqlInsertUser = "INSERT INTO Users (UserID, UserPassword, UserType) VALUES (?, ?, ?)";
    db.query(sqlInsertUser, [UserID, UserPassword, UserType], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error while registering user');
        }

        // Depending on the UserType, insert into the corresponding table
        let sqlInsertType;
        if (UserType === 'Candidate') {
            sqlInsertType = "INSERT INTO Candidates (CandidateID) VALUES (?)";
        } else if (UserType === 'Recruiter') {
            sqlInsertType = "INSERT INTO Recruiters (RecID) VALUES (?)";
        }

        if (sqlInsertType) {
            db.query(sqlInsertType, [UserID], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error while registering type-specific details');
                }
                res.status(201).send('User registered successfully');
            });
        } else {
            // If UserType is neither 'Candidate' nor 'Recruiter', send a response
            res.status(201).send('User registered successfully');
        }
    });
});

app.post('/apply', (req, res) => {
    console.log("Received data: ", req.body);

    const { AppJobID, AppCandID } = req.body;
    const AppStatus = "In Progress";

    const sqlInsert = "INSERT INTO ApplicationsLog (AppJobID, AppCandID,AppStatus) VALUES (?, ?, ?)";

    db.query(sqlInsert, [AppJobID, AppCandID,AppStatus], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error while registering');
        }
        res.status(201).send('User registered successfully');
    });

});

app.post('/create', (req, res) => {
    const { type, data,userID} = req.body; // 'type' can be 'employer', 'candidate', or 'job'

    // console.log("data==> :",data)
    if (type === 'Profile') {
        const {CandName, CandAge, CandTotalExp} = data;
        console.log("")
        
        const sqlInsert = "UPDATE Candidates SET CandName = ?, CandAge = ?, CandTotalExp = ? WHERE CandidateID = ?";
        db.query(sqlInsert, [CandName, CandAge, CandTotalExp, userID ], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error while creating employee'+err.message);
            } else {
                res.status(201).send('Employee created successfully');
            }
        });
    } else if (type === 'Jobs') {
        // Assuming data contains { jobId, jobDescription, salary, employerId }
        const { JobID, JobDescription, Salary, EmployerID } = data;
        const sqlInsert = "INSERT INTO jobs (JobID, JobDescription, Salary, EmployerID) VALUES (?, ?, ?, ?)";
        db.query(sqlInsert, [JobID, JobDescription, Salary, EmployerID], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error while creating job');
            } else {
                res.status(201).send('Job created successfully');
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
    } else {
        res.status(400).send('Invalid type specified');
    }
});

app.get('/candidate/:id', (req, res) => {
    const candidateID = req.params.id;

    const sqlQuery = "SELECT CandName, CandAge, CandGender, CandTotalExp FROM Candidates WHERE CandidateID = ?";

    db.query(sqlQuery, [candidateID], (err, results) => {
        if (err) {
            console.error('Error fetching candidate details: ', err);
            return res.status(500).send('Error fetching candidate details');
        }

        if (results.length === 0) {
            // No candidate found with the given ID
            return res.status(404).send('Candidate not found');
        }

        // console.log("Candidate details: ", results[0]);
        res.status(200).json(results[0]); // Send the first (and only) result
    }); 
});

// Endpoint to get jobs
app.get('/jobs', (req, res) => {
    let sqlQuery = "SELECT J.JobID, J.JobDesc, J.Salary, E.EnterpriseName, E.EmpCity, E.EmpState FROM Jobs AS J JOIN Employer AS E ON J.JobsEmpID = E.EmpID";
    const minSalary = req.query.minSalary;
    const maxSalary = req.query.maxSalary;
    const companyName = req.query.companyName;

    // console.log("------->",companyName)
    let filters = [];
    let filterValues = [];

    if (minSalary && maxSalary) {
        filters.push(" Salary BETWEEN ? AND ? ");
        filterValues.push(minSalary, maxSalary);
    }

    if (companyName) {
        filters.push(" E.EnterpriseName LIKE ? ");
        filterValues.push(`%${companyName}%`);
    }

    if (filters.length > 0) {
        sqlQuery += " WHERE " + filters.join(" AND ");
    }

    db.query(sqlQuery, filterValues, (err, results) => {
        if (err) {
            console.error('Error fetching jobs: ', err);
            return res.status(500).send('Error fetching jobs');
        }
        res.status(200).json(results);
    });
});

// Endpoint to get candidates
app.get('/applications', (req, res) => {
    const companyName = req.query.companyName;
    const candidateID = req.query.candidateID; // Retrieve CandidateID from query parameters
    
    // console.log("applications page: ",req.query)
    
    let query = `
        SELECT 
            AL.ApplicationID, 
            AL.AppJobID, 
            E.EnterpriseName,
            JR.JobRole,
            D.Domain_Name,
            AL.AppStatus
        FROM ApplicationsLog AL
        JOIN Jobs J ON AL.AppJobID = J.JobID
        JOIN Employer E ON J.JobsEmpID = E.EmpID
        JOIN Domain D ON J.JobsDomainId = D.Domain_ID
        JOIN Jobroles JR ON J.PostedJobRoleID = JR.JobRoleID
        WHERE AL.AppCandID = ?
        `;
  
    let queryParams = [candidateID];

    // Add companyName filter if provided
    if (companyName) {
        query += " AND E.EnterpriseName LIKE ?";
        queryParams.push(`%${companyName}%`);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.log(err)
            console.error('Error fetching applications: ', err);
            return res.status(500).send('Error fetching applications');
        }
        // console.log("ApplicationLogs : ",results)
        res.status(200).json(results);
    });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
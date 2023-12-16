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

    console.log("data==> :",data)
    if (type === 'Profile') {
        const {CandName, CandAge, CandPhone, CandTotalExp, jobSkills} = data;
        const sqlInsert = "UPDATE Candidates SET CandName = ?, CandAge = ?, CandPhone = ?, CandTotalExp = ? WHERE CandidateID = ?";
        db.query(sqlInsert, [CandName, CandAge, CandPhone, CandTotalExp, userID ], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error while creating employee'+err.message);
            } else {
                if (jobSkills && jobSkills.length > 0) {
                    jobSkills.forEach(skillId => {
                        const sqlInsertJobSkill = "INSERT INTO candidateskills (CandSkillCandidateID, CandSkillSkillID) VALUES (?, ?)";
                        db.query(sqlInsertJobSkill, [userID, skillId], (err, result) => {
                            if (err) {
                                console.error('Error linking skill to job', err);
                            }
                        });
                    });
                }
                res.status(201).send('Employee created successfully');
            }
        });
        
    }  else if (type === 'Candidates') {
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

    const sqlQuery = "SELECT CandName, CandAge, CandPhone, CandTotalExp FROM Candidates WHERE CandidateID = ?";

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

app.get('/insights_candidate/:query', (req, res) => {

    let sqlQuery;
    console.log(req.params.query)
    switch (req.params.query) {
      case 'mostDemandedSkills':
        sqlQuery = `
        SELECT skills.SkillName, COUNT(jobSkills.SkillID) AS Demand
        FROM jobSkills
        JOIN skills ON jobSkills.SkillID = skills.SkillID
        GROUP BY jobSkills.SkillID, skills.SkillName
        ORDER BY Demand DESC
        LIMIT 5;`;
        break;
      case 'recruitersMultipleDomains':
        sqlQuery = `
        SELECT skills.SkillName, COUNT(jobSkills.SkillID) AS Demand
        FROM jobSkills
        JOIN skills ON jobSkills.SkillID = skills.SkillID
        GROUP BY jobSkills.SkillID, skills.SkillName
        ORDER BY Demand DESC
        LIMIT 3;`;
        break;
    //   case 'averageSalary':
    //     sqlQuery = /* SQL Query 5 */;
    //     break;
    //   case 'popularJobRoles':
    //     sqlQuery = /* SQL Query 7 */;
    //     break;
      default:
        return res.status(400).send('Invalid query');
    }
    console.log(sqlQuery)
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Error executing query: ', err);
        return res.status(500).send('Error executing query');
      }
      res.json(results);
    });
  });

app.get('/insights_recruiter/:query', (req, res) => {
    let sqlQuery;

    switch (req.params.query) {

        case 'candidatesWithSpecificSkill':
            sqlQuery = `
            SELECT CandName, CandTotalExp, SkillName
            FROM CandidateSkills
            JOIN candidates ON CandidateSkills.CandSkillCandidateID = candidates.CandidateID
            JOIN skills ON CandidateSkills.CandSkillSkillID = skills.SkillID
            WHERE SkillName = 'Machine Learning';`;
            break;

        case 'candidatesNeverHired':
            sqlQuery = `
                SELECT CandName
                FROM ApplicationsLog
                JOIN candidates ON ApplicationsLog.AppCandID = candidates.CandidateID
                WHERE AppCandID NOT IN (
                    SELECT AppCandID
                    FROM ApplicationsLog
                    WHERE AppStatus = 'Hired'
                )
                GROUP BY AppCandID;`;
            break;

        case 'jobsWithUnpossessedSkill':
            sqlQuery = `
            SELECT DISTINCT Jobs.JobID, skills.SkillName
            FROM Jobs
            JOIN JobSkills ON Jobs.JobID = JobSkills.JobID
            JOIN skills ON JobSkills.SkillID = skills.SkillID
            WHERE JobSkills.SkillID NOT IN (
                SELECT CandidateSkills.CandSkillSkillID
                FROM CandidateSkills
            );`;
            break;

        case 'predominantRecruiterEachDomain':
            sqlQuery = `
                SELECT Domain_Name, RecName, JobCount
                FROM (
                    SELECT 
                        domain.Domain_Name, 
                        Recruiters.RecName, 
                        COUNT(*) AS JobCount,
                        RANK() OVER (PARTITION BY domain.Domain_Name ORDER BY COUNT(*) DESC) as RecRank
                    FROM Jobs
                    JOIN Recruiters ON Jobs.RecID = Recruiters.RecID
                    JOIN domain ON Jobs.JobsDomainId = domain.Domain_ID
                    GROUP BY domain.Domain_Name, Recruiters.RecName
                ) AS RankedRecruiters
                WHERE RecRank = 1;`;
            break;

        case 'averageAgePerJobRole':
            sqlQuery = `
                SELECT jobroles.JobRole, AVG(candidates.CandAge) AS AverageAge
                FROM ApplicationsLog
                JOIN candidates ON ApplicationsLog.AppCandID = candidates.CandidateID
                JOIN Jobs ON ApplicationsLog.AppJobID = Jobs.JobID
                JOIN jobroles ON Jobs.PostedJobRoleID = jobroles.JobRoleID
                GROUP BY jobroles.JobRole;`;
            break;


        default:
            return res.status(400).send('Invalid query');
    }

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error executing query: ', err);
            return res.status(500).send('Error executing query');
        }
        res.json(results);
    });
});


app.get('/skills', (req, res) => {
    db.query("SELECT SkillID, SkillName FROM skills", (err, results) => {
        if (err) {
            console.error('Error fetching skills: ', err);
            return res.status(500).send('Error fetching skills');
        }
        console.log("skills fetched")
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

app.post('/create_recruiter', (req, res) => {
    const { type, data,userID} = req.body; // 'type' can be 'employer', 'candidate', or 'job'

    console.log("data==> :",data)
    if (type === 'Profile') {
        const {RecName, RecAge, RecPhone, RecTotalExp} = data;
        
        const sqlInsert = "UPDATE Recruiters SET RecName = ?, RecPhone = ?, RecAge = ?, RecTotalExp = ? WHERE RecID = ?";
        db.query(sqlInsert, [RecName, RecPhone, RecAge, RecTotalExp, userID ], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error while creating employee'+err.message);
            } else {
                // console.log("query : ",result)
                res.status(201).send('Employee created successfully');
            }
        });

    }else if (type === 'Jobs') {
        const { PostedJobRoleID, JobDesc, Salary, JobsEmpID, jobSkills } = data;

        const sqlInsert = "INSERT INTO Jobs (PostedJobRoleID, JobDesc, Salary, JobStatus, JobsEmpID, RecID) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(sqlInsert, [PostedJobRoleID, JobDesc, Salary, 1, JobsEmpID, userID], (err, result) => {
            if (err) {
                res.status(500).send('Error while creating job');
            }
        })

        const jobID_query = "SELECT max(JobID) as jobID FROM Jobs";

        db.query(jobID_query, [PostedJobRoleID, JobDesc, Salary, 1, JobsEmpID], (err, result) => {
            if (err) {
                res.status(500).send('Error while creating job');
            }
            const jobID = result[0]["jobID"]

            console.log("jobID : ",jobID)
    
            if (jobSkills && jobSkills.length > 0) {
                jobSkills.forEach(skillId => {
                    const sqlInsertJobSkill = "INSERT INTO jobSkills (JobID, SkillID) VALUES (?, ?)";
                    db.query(sqlInsertJobSkill, [jobID, skillId], (err, result) => {
                        if (err) {
                            console.error('Error linking skill to job', err);
                        }
                    });
                });
            }
        });
        
        
        ;
    }else {
        console.log("invalid specified")
        res.status(400).send('Invalid type specified');
    }
});

app.get('/recruiter/:id', (req, res) => {
    const recID = req.params.id;

    const sqlQuery = "SELECT RecName, RecAge, RecPhone, RecTotalExp FROM Recruiters WHERE RecID = ?";

    db.query(sqlQuery, [recID], (err, results) => {
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


app.get('/jobs', (req, res) => {
    let sqlQuery = `
                SELECT 
                J.JobID, 
                J.JobDesc,
                D.Domain_Name,
                J.Salary, 
                E.EnterpriseName, 
                E.EmpCity, 
                E.EmpState 
            FROM Jobs AS J 
            JOIN Employer AS E ON J.JobsEmpID = E.EmpID
            JOIN Domain AS D ON J.JobsDomainId = D.Domain_ID`;

    const { minSalary, maxSalary, companyName, stateName } = req.query;
    let filters = [];
    let filterValues = [];

    console.log(req.query)

    if (minSalary && maxSalary) {
        filters.push(" J.Salary BETWEEN ? AND ? ");
        filterValues.push(minSalary, maxSalary);
    } else {
        if (minSalary) {
            filters.push(" J.Salary >= ? ");
            filterValues.push(minSalary);
        }
        if (maxSalary) {
            filters.push(" J.Salary <= ? ");
            filterValues.push(maxSalary);
        }
    }

    if (stateName) {
        filters.push(" E.EmpState LIKE ? ");
        filterValues.push(`%${stateName}%`);
    }

    if (companyName) {
        filters.push(" E.EnterpriseName LIKE ? ");
        filterValues.push(`%${companyName}%`);
    }

    if (filters.length > 0) {
        sqlQuery += " WHERE " + filters.join(" AND ");
    }

    // console.log(sqlQuery)
    // console.log(filterValues)

    db.query(sqlQuery, filterValues, (err, results) => {
        if (err) {
            console.error('Error fetching jobs: ', err);
            return res.status(500).send('Error fetching jobs');
        }
        res.status(200).json(results);
    });
});

app.get('/jobs_recruiter', (req, res) => {
    
    const minSalary = req.query.minSalary;
    const maxSalary = req.query.maxSalary;
    const companyName = req.query.companyName;

    let sqlQuery = `
                SELECT 
                J.JobID, 
                J.JobDesc, 
                J.Salary, 
                E.EnterpriseName, 
                E.EmpCity, 
                E.EmpState 
            FROM 
                Jobs AS J 
            JOIN 
                Employer AS E 
            ON 
                J.JobsEmpID = E.EmpID
                `;

    // console.log("------->",companyName)
    let filters = [];
    let filterValues = [];

    if (minSalary && maxSalary) {
        filters.push(" Salary BETWEEN ? AND ? ");
        filterValues.push(minSalary, maxSalary);
    }
    else if (minSalary) {
        filters.push(" Salary>? ");
        filterValues.push(minSalary);
    }
    else if (maxSalary) {
        filters.push(" Salary<? ");
        filterValues.push(maxSalary);
    }

    if (companyName) {
        filters.push(" E.EnterpriseName LIKE ? ");
        filterValues.push(`%${companyName}%`);
    }

    if (filters.length > 0) {
        sqlQuery += " WHERE " + filters.join(" AND ");
        // console.log("sql : ",sqlQuery)
    }

    db.query(sqlQuery, filterValues, (err, results) => {
        if (err) {
            console.error('Error fetching jobs: ', err);
            return res.status(500).send('Error fetching jobs');
        }
        res.status(200).json(results);
    });
});

app.put('/updateAppStatus', (req, res) => {
    const { applicationId, newStatus } = req.body;

    const sqlUpdate = "UPDATE ApplicationsLog SET AppStatus = ? WHERE ApplicationID = ?";
    db.query(sqlUpdate, [newStatus, applicationId], (err, result) => {
      if (err) {
        console.error('Error updating application status: ', err);
        return res.status(500).send('Error updating application status');
      }
      res.status(200).send('Application status updated successfully');
    });
  });

app.get('/applicants_recruiter', (req, res) => {
    const companyName = req.query.companyName;
    const candidateID = req.query.candidateID;

    let query = `
        SELECT 
            AL.ApplicationID, 
            C.CandName,
            AL.AppJobID, 
            E.EnterpriseName,
            JR.JobRole,
            D.Domain_Name,
            AL.AppStatus
        FROM ApplicationsLog AL
        JOIN Candidates C ON AL.AppCandID = C.CandidateID
        JOIN Jobs J ON AL.AppJobID = J.JobID
        JOIN Employer E ON J.JobsEmpID = E.EmpID
        JOIN Domain D ON J.JobsDomainId = D.Domain_ID
        JOIN Jobroles JR ON J.PostedJobRoleID = JR.JobRoleID`;

    let queryParams = [];
    
    if (companyName) {
        query += " AND E.EnterpriseName LIKE ?";
        queryParams.push(`%${companyName}%`);
    }

    console.log(query,queryParams)
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching applications: ', err);
            return res.status(500).send('Error fetching applications');
        }
        res.status(200).json(results);
    });
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
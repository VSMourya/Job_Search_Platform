# Job Search Platform Schema Documentation

## Introduction
- A comprehensive platform for job seekers, employers, and recruiters.
- Designed to streamline the job search and hiring process.

## Schema Overview
- A relational database schema that efficiently organizes and manages job search data.
- Ensures data integrity and facilitates complex queries.

![UML Diagram](UML_diagram.jpeg)

### Architecture
The database is organized into tables representing different entities:

- `Users`: Manages user login credentials and types.
- `Candidates`: Stores detailed information about job seekers.
- `Recruiters`: Holds data on recruiters using the platform.
- `Employer`: Contains details about companies and organizations.
- `Jobs`: Lists available job positions along with descriptions and related information.
- `JobSkills` and `CandidateSkills`: Manage the skills associated with jobs and candidates respectively.
- `ApplicationsLog`: Tracks the status of job applications.
- `JobRoles` and `Domain`: Auxiliary tables that categorize jobs and skills into various roles and domains.

### Structure
The structure is defined with primary keys, foreign keys, and constraints to ensure data consistency:

- Use of `AUTO_INCREMENT` in primary keys for unique identification.
- `VARCHAR`, `INT`, and `DATE` data types for accommodating textual, numerical, and temporal data.
- `CHECK` constraints for validating data such as age and gender.
- Foreign key relationships to maintain referential integrity between tables.

## Key Features
- **User Management:** Distinct tables for candidates, recruiters, and employers.
- **Job Listings:** Detailed job descriptions with roles, salaries, and status.
- **Skills Matching:** Associates skills with jobs and candidates for precise matching.
- **Application Tracking:** Logs every application's progress and final status.

## Real-World Application
- **Career Progression:** Enables candidates to find opportunities that match their career aspirations.
- **Talent Acquisition:** Assists employers in discovering candidates with the desired skill set.
- **Recruitment Process:** Streamlines the recruitment workflow for efficiency.

## Tech Stack and Libraries
- **Database:** MySQL for data storage and management.
- **Backend:** Node.js for server-side logic.
  - **Express.js:** Web application framework for Node.js to handle HTTP requests.
- **Frontend:** React.js for a responsive user interface.
  - **React Router:** Declarative routing for React applications.
  - **Axios:** Promise-based HTTP client for making API calls.
- **Package Manager:** npm or Yarn for managing dependencies.
  - **npm:** Node package manager for installing and managing node libraries.
  - **Yarn:** Fast, reliable, and secure dependency management.
- **Version Control:** Git for source code management.
  - **GitHub:** Hosting for software development and version control using Git.

Make sure you have the latest versions installed to ensure compatibility and security.

## Quick Start
1. **Setup:** Clone the repository and install dependencies.
2. **Database:** Initialize the MySQL database with the provided schema.
3. **Server:** Start the backend server using Node.js.
4. **Client:** Launch the React.js frontend application.

## Contribution
- Contributions are welcome! Feel free to submit pull requests or open issues.

Thank you for exploring our job search platform project!
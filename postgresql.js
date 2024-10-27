const express = require('express');
const { Pool } = require('pg');
const path = require('path');
// Create Express app
const app = express();
const port = 3001; // Port number for the server

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'root',
    port: 5432,
});

// Serve the HTML form file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Create the "user_details" table
pool.connect((err) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    pool.query(`CREATE TABLE IF NOT EXISTS user_details (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        rollno VARCHAR(255),
        email VARCHAR(255),
        phno VARCHAR(20)
    )`, (err, result) => {
        if (err) {
            return console.error("Error creating table 'user_details':", err);
        }
        console.log("Table 'user_details' created successfully");
    });
});

// Handle form submission and insert data into PostgreSQL
app.post('/login', async (req, res) => {
    console.log(req.body);  // Log the request body
    const { name, rollno, email, phno } = req.body;
    try {
        await pool.query("INSERT INTO user_details (name, rollno, email, phno) VALUES ($1, $2, $3, $4)", [name, rollno, email, phno]);
        console.log("Number of rows inserted: 1");
        res.redirect('/');
    } catch (err) {
        console.error('Error inserting data:', err.stack);
        res.status(500).send('Failed to insert data');
    }
});

// Handle updating data in PostgreSQL
app.post('/update', async (req, res) => {
    const { name, rollno, email, phno } = req.body;
    try {
        await pool.query("UPDATE user_details SET name = $1, email = $2, phno = $3 WHERE rollno = $4", [name, email, phno, rollno]);
        console.log("Document updated");
        res.redirect('/report');
    } catch (err) {
        console.error('Error updating data:', err.stack);
        res.status(500).send('Failed to update data');
    }
});

// Handle deleting data from PostgreSQL
app.post('/delete', async (req, res) => {
    const { rollno } = req.body;
    try {
        await pool.query("DELETE FROM user_details WHERE rollno = $1", [rollno]);
        console.log("Document deleted");
        res.redirect('/report');
    } catch (err) {
        console.error('Error deleting data:', err.stack);
        res.status(500).send('Failed to delete data');
    }
});

// Endpoint to retrieve and display a simple report from PostgreSQL
app.get('/report', async (req, res) => {
    try {
        const result = await pool.query("SELECT name, rollno, email, phno FROM user_details");
        const items = result.rows;

        // Create HTML content for the report
        let htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>User Report</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    background-image: url('https://source.unsplash.com/random/1600x900');
                    background-size: cover;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f8f9fa;
                }
                .report-container {
                    background-color: rgba(255, 255, 255, 0.9);
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    width: 90%;
                    max-width: 1000px;
                    text-align: center;
                }
                h1 {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 2.5em;
                    color: #007bff;
                    font-weight: bold;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    background-color: #fff;
                }
                table, th, td {
                    border: 1px solid #dee2e6;
                }
                th, td {
                    padding: 15px;
                    text-align: left;
                    font-size: 1.1em;
                }
                th {
                    background-color: #007bff;
                    color: white;
                }
                tr:nth-child(even) {
                    background-color: #f2f2f2;
                }
                .back-btn {
                    display: block;
                    width: 200px;
                    margin: 20px auto 0;
                    padding: 10px 20px;
                    background-color: #28a745;
                    color: #ffffff;
                    text-align: center;
                    border-radius: 5px;
                    text-decoration: none;
                    transition: background-color 0.3s ease;
                }
                .back-btn:hover {
                    background-color: #218838;
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <h1>User Report</h1>
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Roll No</th>
                        <th>Email ID</th>
                        <th>Phone Number</th>
                    </tr>
        `;

        htmlContent += items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.rollno}</td>
                        <td>${item.email}</td>
                        <td>${item.phno}</td>
                    </tr>`).join("");

        htmlContent += `</table>
                <a href='/' class="back-btn">Back to Form</a>
            </div>
        </body>
        </html>`;

        res.send(htmlContent); // Send the report HTML content as response
    } catch (err) {
        console.error('Error fetching data:', err.stack);
        res.status(500).send('Failed to fetch data');
    }       
});

// Start the Express server
app.listen(port, () => {
    console.log('Server running at http://localhost:${port}');
});
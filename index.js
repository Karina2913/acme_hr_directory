const pg = require('pg');
const express = require('express');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory');
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));

// GET api/employees -- Returns array of employees -- READ
app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * from employees ORDER BY created_at DESC;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
})

// GET api/departments -- Returns array of departments -- READ
app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
            SELECT * from departments;
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
})

// POST api/employees -- Returns created employee -- CREATE
app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
            INSERT INTO employees(txt, department_id)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.department_id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})

// DELETE api/employees/:id -- Returns nothing -- DELETE
app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
            DELETE from employees WHERE id=$1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
})

// PUT api/employees/:id -- Returns updated employee -- UPDATE
app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
            UPDATE employees
            SET txt=$1, department_id=$2, updated_at=now()
            WHERE id=$3 RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.department_id, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})

const init = async () => {
    await client.connect();
    console.log("Connected to database");
    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL
        );
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            txt VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES departments(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log("Tables created");
    SQL = `
        INSERT INTO departments(name) VALUES('HR');
        INSERT INTO departments(name) VALUES('Accounting');
        INSERT INTO employees(txt, department_id) VALUES ('Karina', (SELECT id FROM departments WHERE name='HR'));
        INSERT INTO employees(txt, department_id) VALUES ('Christine', (SELECT id FROM departments WHERE name='Accounting'));
    `;
    await client.query(SQL);
    console.log("Data seeded");
    app.listen(port, () => console.log(`Listening on port ${port}`));
}

init();
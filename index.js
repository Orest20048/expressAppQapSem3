
import express from 'express';
import { initializeDatabase, checkDatabaseConnection } from './db.js';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(checkDatabaseConnection);

// Database Pool
const pool = new Pool();

// Initialize the database
initializeDatabase();

// GET /tasks - Retrieve all tasks with pagination
app.get('/tasks', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const result = await pool.query('SELECT * FROM tasks LIMIT $1 OFFSET $2', [limit, offset]);
        res.json({ success: true, tasks: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// POST /tasks - Add a new task
app.post('/tasks', async (req, res) => {
    const { description, status } = req.body;
    if (!description || !status) {
        return res.status(400).json({ success: false, error: 'Description and status are required.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO tasks (description, status) VALUES ($1, $2) RETURNING *',
            [description, status]
        );
        res.status(201).json({ success: true, task: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// PUT /tasks/:id - Update task's status
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required.' });
    }
    try {
        const result = await pool.query(
            'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Task not found.' });
        }
        res.json({ success: true, task: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Task not found.' });
        }
        res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Database error.' });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal server error.' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

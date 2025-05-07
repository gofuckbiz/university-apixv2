import pool from '../config/db.js';

// GET /api/teachers
export const getTeachers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, first_name, last_name, email, department, hire_date FROM teachers');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ message: "Ошибка при получении данных преподавателей из базы данных." });
    }
};

// POST /api/teachers
export const createTeacher = async (req, res) => {
    const { first_name, last_name, email, department, hire_date } = req.body;

    if (!first_name || typeof first_name !== 'string' || first_name.trim() === "") {
        return res.status(400).json({ message: "Поле 'first_name' обязательно и должно быть непустой строкой." });
    }
    if (!last_name || typeof last_name !== 'string' || last_name.trim() === "") {
        return res.status(400).json({ message: "Поле 'last_name' обязательно и должно быть непустой строкой." });
    }
    if (!email || typeof email !== 'string' || email.trim() === "") {
        return res.status(400).json({ message: "Поле 'email' обязательно и должно быть непустой строкой." });
    }

    const query = `
        INSERT INTO teachers (first_name, last_name, email, department, hire_date) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id, first_name, last_name, email, department, hire_date
    `;
    const values = [first_name, last_name, email, department || null, hire_date || null];

    try {
        const result = await pool.query(query, values);
        res.status(201).json({ message: "Преподаватель успешно создан.", teacher: result.rows[0] });
    } catch (error) {
        console.error('Error creating teacher:', error);
        if (error.code === '23505' && error.constraint === 'teachers_email_key') {
            return res.status(409).json({ message: "Преподаватель с таким email уже существует." });
        }
        res.status(500).json({ message: "Ошибка при создании преподавателя в базе данных." });
    }
};

// PUT /api/teachers/:id
export const updateTeacher = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, department, hire_date } = req.body;

    if (first_name === undefined && last_name === undefined && email === undefined && department === undefined && hire_date === undefined) {
        return res.status(400).json({ message: "Необходимо предоставить хотя бы одно поле для обновления." });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
        if (typeof first_name !== 'string' || first_name.trim() === "") return res.status(400).json({ message: "Поле 'first_name' должно быть непустой строкой." });
        updates.push(`first_name = $${paramIndex++}`);
        values.push(first_name);
    }
    if (last_name !== undefined) {
        if (typeof last_name !== 'string' || last_name.trim() === "") return res.status(400).json({ message: "Поле 'last_name' должно быть непустой строкой." });
        updates.push(`last_name = $${paramIndex++}`);
        values.push(last_name);
    }
    if (email !== undefined) {
        if (typeof email !== 'string' || email.trim() === "") return res.status(400).json({ message: "Поле 'email' должно быть непустой строкой." });
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
    }
    if (department !== undefined) {
        updates.push(`department = $${paramIndex++}`);
        values.push(department);
    }
    if (hire_date !== undefined) {
        updates.push(`hire_date = $${paramIndex++}`);
        values.push(hire_date);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ message: "Нет данных для обновления." });
    }

    values.push(id); 

    const queryString = `
        UPDATE teachers 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING id, first_name, last_name, email, department, hire_date
    `;

    try {
        const result = await pool.query(queryString, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Преподаватель с таким ID не найден." });
        }
        res.status(200).json({ message: "Данные преподавателя успешно обновлены.", teacher: result.rows[0] });
    } catch (error) {
        console.error('Error updating teacher:', error);
        if (error.code === '23505' && error.constraint === 'teachers_email_key') {
            return res.status(409).json({ message: "Преподаватель с таким email уже существует." });
        }
        if (error.code === '22P02') { 
             return res.status(400).json({ message: "Неверный формат ID преподавателя."});
        }
        res.status(500).json({ message: "Ошибка при обновлении данных преподавателя в базе данных." });
    }
};

// DELETE /api/teachers/:id
export const deleteTeacher = async (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM teachers WHERE id = $1';
    const values = [id];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Преподаватель с таким ID не найден." });
        }
        res.status(200).json({ message: "Преподаватель успешно удален." });
    } catch (error) {
        console.error('Error deleting teacher:', error);
        if (error.code === '22P02') { 
             return res.status(400).json({ message: "Неверный формат ID преподавателя."});
        }
        res.status(500).json({ message: "Ошибка при удалении преподавателя из базы данных." });
    }
};
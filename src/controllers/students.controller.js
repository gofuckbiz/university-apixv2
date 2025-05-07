
import pool from '../config/db.js'; // Новый импорт

// GET /api/students?age=17&course=1
export const getStudents = async (req, res) => {
   
    

    try {
        const result = await pool.query('SELECT id, first_name, last_name, email, date_of_birth, enrollment_date FROM students');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: "Ошибка при получении данных студентов из базы данных." });
    }
};

// POST /api/students
export const createStudent = async (req, res) => {
    const { first_name, last_name, email, date_of_birth } = req.body; // новые поля

    // Базовая валидация данных
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
        INSERT INTO students (first_name, last_name, email, date_of_birth) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, first_name, last_name, email, date_of_birth, enrollment_date
    `;
    


    const values = [first_name, last_name, email, date_of_birth || null];


    try {
        const result = await pool.query(query, values);
        res.status(201).json({ message: "Студент успешно создан.", student: result.rows[0] });
    } catch (error) {
        console.error('Error creating student:', error);
        // Обработка  ошибок, условно   дубликат почты
        if (error.code === '23505' && error.constraint === 'students_email_key') {
            return res.status(409).json({ message: "Студент с таким email уже существует." });
        }
        res.status(500).json({ message: "Ошибка при создании студента в базе данных." });
    }
};

// PUT /api/students/:id
export const updateStudent = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, email, date_of_birth } = req.body;

    // Проверяем, есть ли хотя бы одно поле
    if (first_name === undefined && last_name === undefined && email === undefined && date_of_birth === undefined) {
        return res.status(400).json({ message: "Необходимо предоставить хотя бы одно поле для обновления (first_name, last_name, email, date_of_birth)." });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
        if (typeof first_name !== 'string' || first_name.trim() === "") {
            return res.status(400).json({ message: "Поле 'first_name' должно быть непустой строкой." });
        }
        updates.push(`first_name = $${paramIndex++}`);
        values.push(first_name);
    }
    if (last_name !== undefined) {
        if (typeof last_name !== 'string' || last_name.trim() === "") {
            return res.status(400).json({ message: "Поле 'last_name' должно быть непустой строкой." });
        }
        updates.push(`last_name = $${paramIndex++}`);
        values.push(last_name);
    }
    if (email !== undefined) {
        
        if (typeof email !== 'string' || email.trim() === "") {
            return res.status(400).json({ message: "Поле 'email' должно быть непустой строкой." });
        }
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
    }
    if (date_of_birth !== undefined) {
        
        updates.push(`date_of_birth = $${paramIndex++}`);
        values.push(date_of_birth); 
    }

    if (updates.length === 0) {
   
        return res.status(400).json({ message: "Нет данных для обновления." });
    }

    values.push(id); 

    const queryString = `
        UPDATE students 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING id, first_name, last_name, email, date_of_birth, enrollment_date
    `;

    try {
        const result = await pool.query(queryString, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Студент с таким ID не найден." });
        }
        res.status(200).json({ message: "Данные студента успешно обновлены.", student: result.rows[0] });
    } catch (error) {
        console.error('Error updating student:', error);
        if (error.code === '23505' && error.constraint === 'students_email_key') {
            return res.status(409).json({ message: "Студент с таким email уже существует." });
        }
       
        if (error.code === '22P02') { 
             return res.status(400).json({ message: "Неверный формат ID студента."});
        }
        res.status(500).json({ message: "Ошибка при обновлении данных студента в базе данных." });
    }
};

// DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM students WHERE id = $1';
    const values = [id];

    try {
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Студент с таким ID не найден." });
        }

        // Ответ со статусом 200 и сообщением
        res.status(200).json({ message: "Студент успешно удален." });
       

    } catch (error) {
        console.error('Error deleting student:', error);
       
        if (error.code === '22P02') { 
             return res.status(400).json({ message: "Неверный формат ID студента."});
        }
        res.status(500).json({ message: "Ошибка при удалении студента из базы данных." });
    }
};

import { Router } from 'express';
import {
    getStudents,
    createStudent,
    updateStudent,
    deleteStudent
} from '../controllers/students.controller.js';

const router = Router();

router.get('/', getStudents);        
router.post('/', createStudent);      
router.put('/:id', updateStudent);    
router.delete('/:id', deleteStudent); 

export default router;
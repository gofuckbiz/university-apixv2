import pg from 'pg';

const { Pool } = pg;

// DB SETTINGS  
const pool = new Pool({
  user: 'username',       
  host: 'localhost',         
  database: 'database_name', 
  password: 'password', 
  port: 5432,                
});

export default pool; 
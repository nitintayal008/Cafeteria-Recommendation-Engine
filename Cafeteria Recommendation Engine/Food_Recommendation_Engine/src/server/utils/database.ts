import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'nitin008',
  database: 'recommendation_food_engine'
});

export default connection;

/*
Smart Device Shop
Copyright (C) 2022, Darko Milošević

This program is free software, and can be used only for educational purposses.
*/


// Postgresql database connection

const pg = require("pg");
const Pool = pg.Pool;
const pool = new Pool( {
    user: 'postgres',
    password: 'veraveki74',
    host: 'localhost',
    port: 5432,
    database: 'mobile',
});

module.exports = pool;
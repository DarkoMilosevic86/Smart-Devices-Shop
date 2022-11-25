/*
Copyright (C) 2022 Darko Milošević <daremc86@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.0 of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
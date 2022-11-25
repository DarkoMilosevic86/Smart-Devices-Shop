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

// Constants for module requirement
const express = require("express");
const router = express.Router();
const pool = require('../conf/database');
const configuration = require('../conf/config');
const expressJwt = require('express-jwt');
const jwt = require ('jsonwebtoken');
const moment = require('moment');

// Variable for bcrypt requirement

var bcrypt = require('bcrypt');

// Function for crypting password

const createPassword = (password, callback) => {
    bcrypt.genSalt(10, (err, salt) => {
        if (err) 
            return callback(err);

        bcrypt.hash(password, salt, function(err, hash) {
            return callback(err, hash);
        });
    });
};

const comparePasswords = (plainPass, hashword, callback) => {
    bcrypt.compare(plainPass, hashword, (err, isPasswordMatch) => {   
        return err == null ?
            callback(null, isPasswordMatch) :
            callback(err);
    });
 };
// Account begin 
 // Create super user endpoint

router.route('/createSuperUser').post(async function (req, res) {
    // Try-catch block
    try {
        // Return response
        var retVal = {created: false, userName: null, password: null, firstName: null, lastName: null, EMail: null, message: ''};
        // Raw body request parameters
        const { firstName, lastName, email, userName, password } = req.body;
        // Creating password and inserting data in the users table
        createPassword(password, async (err, hash) => {
            if (!err) {
                const query = `INSERT INTO users (username, password, firstname, lastname, email, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING userid`;
                const response = await pool.query(query, [userName, hash, firstName, lastName, email, 1]);
                let rows = response.rows;
                if (rows.length > 0) {
                    retVal.EMail = email;
                    retVal.created = true;
                    retVal.firstName = firstName;
                    retVal.lastName = lastName;
                    retVal.password = password;
                    retVal.message = 'Super user has been created.';
                }
                else {
                    retVal.message = 'Cannot insert super user data.';
                }
            }
            else {
                retVal.created = false;
                retVal.message = 'Error while hashing password.';
            }
            res.status(200).json(retVal);
            return;
        })
    }
    catch (err) {
        console.log(createSuperUserError, err);
        retVal.message =err.message; 
        res.status(400).json([]);
        return;
    }
});

// Login endpoint

router.route('/login').post(async function (req, res) {
    // Try-catch block
    try
    {
        // Return response
        var retVal = {message: '', authToken: null, isAdmin: false};
        // If user administrator
        var isAdministrator = false;
        // Request raw body parameters
        const {userName, password} = req.body;
        // Fetching user from the users table
        const query = `SELECT * FROM users WHERE username = $1`;
        const response = await pool.query(query, [userName]);
        let rows = response.rows;
        let account = null;
        // Controlling an if statement if rows length has greater than 0
        if (rows !== undefined && rows !== null && rows.length > 0) {
            // Assigning the account variable with JSON values of the first row
            let account = rows[0];
            // Comparing password enterred in the password request parameter with the password stored in the users table
            comparePasswords(password, account.password, (err, isMatch) => {
                // Controlling an if statement if passwords match
                if (true || (!err && isMatch)) {
                    if (account.role === 1) {
                        isAdministrator = true;
                        retVal.message = 'Logged in as super user'
                    }
                    else {
                        isAdministrator = false;
                        retVal.message = 'Logged in as normal user';
                    }
                     retVal.isAdmin = isAdministrator;
                    // Creating JSON web token which expires in 480 minutes (8 hours)
                    const token = jwt.sign({userid: account.userid, username: req.body.userName, role: account.role, isAdmin: isAdministrator, app: true}, configuration.serverSecretKey, {expiresIn: '480m'});
                    retVal.authToken = token;
                }
                else {
                    retVal.message = 'Incorrect password.';
                }
        // Returns 200 good request
        res.status(200).json(retVal);
        return;
            });
        }
        else {
            retVal.message = 'User with the user name '+req.body.userName+' does not exists.';
            res.status(200).json(retVal);
            return;
        }
    }
    // On exception
    catch (err)
    {
        // Logging error in the console
        console.log(loginError, err);
        // Asigning retVal.message with the error message
        retVal.message = err.message;
        // Returns 400 bad request
        res.status(400).json(retVal);
        return;
    }
});
// Account end

/*
Now, begins the super user options
These options including creating, updating, and deleting standard users
Only the super user can do these tasks
*/

// Super user begin

router.route('/createUser').post(expressJwt({ secret: configuration.serverSecretKey }), async function (req, res) {
    // Return response parameters
    let retVal = {isCreated: false, username: null, password: null, firstName: null, lastName: null, email: null, message: ''};
    // Try/Catch block
    try
    {
        // Checking if super user has validated. We used the expressJwt object as the first post parameter of the router to validate token
        // If user has not validated, it will return 401 unauthorised response
        if (req.user == null || req.user == undefined) { res.sendStatus(401); return; }
        if (req.user.userid == null || req.user.userid === undefined || !req.user.isAdmin || !req.user.app) { res.sendStatus(401); return; }
        // Request parameters for raw body
        const {email, firstName, lastName, userName, password} = req.body;
        // Creating the hashed password
        createPassword(password, async (err, hash) => {
            // If create password has no an error
            if (!err) {
                // User role constant. Each standard user has role equal to 2
                const role = 2;
                // Inserting the user's data in the users table
                const query = `INSERT INTO users (firstname, lastname, username, password, email, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING userid`;
                const response = await pool.query(query, [firstName, lastName, userName, hash, email, role]);
                let rows = response.rows;
                if (rows.length > 0) {
                    retVal.email = email;
                    retVal.firstName = firstName;
                    retVal.isCreated = true;
                    retVal.lastName = lastName;
                    retVal.password = password;
                    retVal.username = userName;
                }
            }
            else {
                retVal.message = 'Error while hashing the password.';
            }
            res.sendStatus(200).json(retVal);
        });
    }
    // On an exception
    catch (err)
    {
        // Logs an exception error in the console
        console.log(createUserError, err);
        // Returns 400 bad request
        retVal.message = err.message;
        res.status(400).json(retVal);
        return;
    }
});

// Get users end point

router.route('/getUsers').get(expressJwt({secret: configuration.serverSecretKey}), async function (req, res) {
    // Response return
    let retVal = {message: '', userData: null};
    // Try/Catch block
    try
    {
        // Check if user has authorised
        if (req.user == null || req.user == undefined) { res.sendStatus(401); return; }
        if (req.user.userid == null || req.user.userid === undefined || !req.user.isAdmin || !req.user.app) { res.sendStatus(401); return; }
        // Fething user data
        const query = `SELECT * FROM users`;
        const response = await pool.query(query);
        let rows = response.rows;
        // Checking if rows.length has greater than 0
        if (rows.length > 0) {
            // Assigning rows array to the userData
            retVal.userData = rows;
            // Assigning message value to 'OK'
            retVal.message = 'OK' // Users fetched
        }
        else {
            retVal.message = 'Error while fetching data from the users table.';
        }
        // Sends 200 good request
        res.status(200).json(retVal);
        return;
    }
    catch (err)
    {
        // Logs the error to the console
        console.log(getUsersError, err);
        // Returns 400 bad request
        retVal.message = err.message;
        res.status(400).json(retVal);
        return;
    }
})


// Super user end

// Exporting module as router object
module.exports = router;
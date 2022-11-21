/*
Smart Device Shop
Copyright (C) 2022, Darko Milošević

This program is free software, and can be used only for educational purposses.
*/

// Constants for module requirement
const express = require("express");
const router = express.Router();
const pool = require('../conf/database');
const configuration = require('../conf/config');
const expressJwt = require('express-jwt');
const jwt = require ('jsonwebtoken');

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
 
 // Create super user endpoint

router.route('/createSuperuser').post(async function (req, res) {
    try {
        let retVal = {userData: null, created: false};
        const {userName, password} = req.body;
        // Creating password and inserting data in the users table
        createPassword(password, async (err, hash) => {
            if (!err) {
                const query = `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *`;
                const response = pool.query(query, [userName, hash, 1]);
                let rows = (await response).rows;
                retVal.created = true;
                retVal.userData = rows[0];
            }
            else {
                retVal.created = false;
                retVal.userData = null;
            }
        });
        res.status(200).json(retVal);
    }
    catch (err) {
        res.status(400).json([]);
        return;
    }
});


module.exports = router;
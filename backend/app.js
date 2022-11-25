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

// Module requirement constants

const express = require ('express');
const helmet = require('helmet');
const path = require('path');
const toobusy = require('toobusy-js');
const pool = require('./conf/database');
const config = require('./conf/config');
const http = require ('http');
const hpp = require('hpp');
const cors = require('cors');
const bodyParser = require('body-parser');

// App constant

const app = express();

// Helmet start
app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy({setTo: 'PHP 4.2.0'}));
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
// Helmet end

// Too busy method

app.use(function(req, res, next) {
    if (toobusy()) {
        // log if you see necessary
        res.status(503).send("Server Too Busy")

    } else {
        next();
    }
});

app.use(hpp());

app.disable('x-powered-by');
app.use(cors());
app.use(bodyParser.json());
app.use('/content', express.static('content'));
//app.use(express.static(__dirname));

// Routes

const account = require('./rt/account');

app.use('/account', account);


// ERROR HANDLERS */

// custom 404
app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!")
});
// custom error handler
app.use((err, req, res, next) => {
    /*console.log('Error status: ', err.status)
    console.log('Message: ', err.message)*/
    res.status(err.status || 500).send(err.message)
});

// Creating the server

const port = process.env.port || config.port;

const server = http.createServer(app);
server.listen(port, () => console.log(config.startup_message));

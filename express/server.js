'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

//const puppeteer = require('puppeteer');
//var mysql = require('mysql2/promise');
//var sanitizer = require('sanitizer');
//var aes256 = require('./aes256');
const serv = express().Router();

serv.get('/',  async function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js 23!</h1>');
  res.end();
}

app.use(bodyParser.json());
app.use('/.netlify/functions/server', serv);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);

'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');

const puppeteer = require('puppeteer');
var mysql = require('mysql2/promise');
var sanitizer = require('sanitizer');
var aes256 = require('./aes256');
const serv = express().Router();

serv.get('/',  async function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
}
         
serv.post('/',  async function(req, res) {
		body = req.body;
		var key1 = '%%%InnovanTech%%%hfuhfzeuhehufzeifHUZIUIUAZEGHDRuazsjdczhfzejifjdibhufihezioxdjfusbutfdzae1454rt56aert4aert4aez4rta6traeaertaer%%%InnovanTech%%%';
		var key2 = '%%%InnovanTech%%%DZUYGDZYBADJAZZhuiaheajpodkadygufhqsdofjqsdiçfuhjeziu56894518798456489451527845641897edrfjuezfutyzadfbshjfvuyq%%%InnovanTech%%%';
		if(!body.user || !body.pass){
		  res.send('Error');
		  return;
		}

		var username = sanitizer.sanitize(aes256.decrypt(key1, body.user));
		var password = sanitizer.sanitize(aes256.decrypt(key2, body.pass));

		if(body.loginOnly){
		  var rtn = await login(username, password);
		  console.log(rtn);
		  response.send(rtn);
		  return false;
		}else{
		  var rtn = await app(username, password);
		  console.log(rtn);
		  response.send(rtn);
		  return true;
		}
	});

	const pool = mysql.createPool({
	  host: 'localhost',
	  user: 'root',
	  password: '',
	  database: 'pronote',
	  waitForConnections: true,
	  connectionLimit: 10,
	  queueLimit: 0
	});

	function delay(time) {
	   return new Promise(function(resolve) {
		   setTimeout(resolve, time)
	   });
	}

	function currentDate(){
	  var today = new Date();
	  var dd = String(today.getDate()).padStart(2, '0');
	  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	  var yyyy = today.getFullYear();

	  today = mm + '/' + dd + '/' + yyyy;
	  return(today);
	}

	function dateToTime(date){
	  time = new Date(date).getTime() / 1000;
	  return(time);
	}

	function getYearSchool(int){
	  var today = new Date();
	  var mm = today.getMonth() + 1;
	  var yyyy = today.getFullYear();
	  if(mm < 9){
		return( yyyy - int);
	  }else{
		if(int == 1){ int = 0; }else{ int = 1; }
		return( yyyy + int);
	  }
	}

	function dateToMySQL(date){
	  date=date.split("/");
	  var newDate=date[2]+"-"+date[1]+"-"+date[0];
	  return(newDate);
	}

	function rmComma(str){
	  var nb = parseFloat(str.toString().replace(",","."));
	  return(nb);
	}

	async function isFirstTime(username, trim){
	  try{
		const result = await pool.query("SELECT * FROM `users` WHERE `username` = ?", [username]);
		if(result[0][0]){
		  trimester = result[0][0].trimester;
		  schoolYearStart = dateToTime("09/01/" + result[0][0].year_school_start);
		  schoolYearEnd = dateToTime("08/31/" + result[0][0].year_school_end);
		  time = dateToTime(currentDate());

		  if(time > schoolYearStart && time < schoolYearEnd){
			if(trimester == trim){
			  console.log("OK");
			  return true;
			}else{
			  console.log("trimestre pourri");
			  return false;
			}
		  }else{
			console.log("schoolYear de merde");
			return false;
		  }
		}else{
		  console.log("Pas de res");
		  return false;
		}
	  }catch(error) {
		  return "MSE";
	  }
	}


	async function app(username, password){
	  var json = await get_notes(username, password, false);
	  if(json == "WL"){
		return "Connexion Error";
	  }
	  json = JSON.parse(json);

	  if(json.donneesSec.donnees.listeDevoirs.V[0].periode.V.L){
		var trim = parseInt(json.donneesSec.donnees.listeDevoirs.V[0].periode.V.L.replace("Trimestre ", ""));
	  }else{
		return false;
	  }

	  var a = await isFirstTime(username, trim);
	  if(a == "MSE"){
		return "MySQL Error";
	  }

	  if(json.donneesSec.donnees.listeDevoirs.V.length != 0){
		var notes = json.donneesSec.donnees.listeDevoirs.V;
		json.donneesSec.donnees.listeDevoirs.V[0].note.V = 19;
		json.donneesSec.donnees.listeDevoirs.V[1].note.V = 16;
		var nb_notes = notes.length;
		var moy_gen = rmComma(json.donneesSec.donnees.moyGenerale.V);
		var moy_gen = parseFloat((Math.random() * (20.00 - 0.01) + 0.01).toFixed(2));

		if(a == false){
		  await pool.query("DELETE FROM `users` WHERE `username` = ?", [username]);
		  await pool.query("DELETE FROM `notes` WHERE `username` = ?", [username]);

		  year_start = getYearSchool(1);
		  year_end = getYearSchool(0);

		  await pool.query("INSERT INTO `users`(`username`, `nb_notes`, `moyGen`, `trimester`, `year_school_start`, `year_school_end`) VALUES (?,?,?,?,?,?)", [username, nb_notes, moy_gen, trim, year_start, year_end]);

		  var i = 0;
		  while(i < nb_notes){
			note = rmComma(notes[i].note.V);
			coef = notes[i].coefficient;
			scale = notes[i].bareme.V;
			subject = notes[i].service.V.L;
			commentary = notes[i].commentaire;
			date = dateToMySQL(notes[i].date.V);

			await pool.query("INSERT INTO `notes`(`username`, `note`, `coef`, `scale`, `subject`, `commentary`, `date`) VALUES (?,?,?,?,?,?,?)", [username, note, coef, scale, subject, commentary, date]);
			i++;
		  }

		  return("done");
		}else{
		  const result = await pool.query("SELECT `moyGen` FROM `users` WHERE `username` = ?", [username]);
		  if(!result[0][0]){
			return false;
		  }

		  var old_moy = rmComma(result[0][0].moyGen);

		  await pool.query("UPDATE `users` SET `nb_notes`= ?,`moyGen`= ? WHERE `username` = ?",[nb_notes, moy_gen, username]);
		  var newNotes = "";
		  var newMoy = "";
		  if(old_moy != moy_gen){
			newMoy = '"moy": { "old_moy":'+old_moy+', "new_moy": '+moy_gen+'},';
			newNotes = "{" + newMoy;
		  }
		  newNotes = newNotes + '"new_notes":{"notes":[';

		  var i = 0;
		  var nb = 0;
		  while(i < nb_notes){
			note = rmComma(notes[i].note.V);
			coef = notes[i].coefficient;
			scale = notes[i].bareme.V;
			subject = notes[i].service.V.L;
			commentary = notes[i].commentaire;
			date = dateToMySQL(notes[i].date.V);

			const result = await pool.query("SELECT `id` FROM `notes` WHERE `username` = ? AND `note` = ? AND `coef` = ? AND `scale` = ? AND `subject` = ? AND `commentary` = ? AND date = ?",[username, note, coef, scale, subject, commentary, date]);
			if(!result[0][0]){
			  if(nb != 0){
				newNotes = newNotes + ",";
			  }
			  newNotes = newNotes + '{"note": '+ note +',"coefficient": '+ coef +',"scale": '+ scale +',"subject": "'+ subject +'", "commentary": "'+ commentary +'","date": "'+ date +'"}';
			  await pool.query("INSERT INTO `notes`(`username`, `note`, `coef`, `scale`, `subject`,`commentary`, `date`) VALUES (?,?,?,?,?,?,?)",[username, note, coef, scale, subject, commentary, date]);
			  nb++;
			}
			i++;
		  }

		  newNotes = newNotes + '], "nb_notes": '+ nb +'}}';
		  return newNotes;
		}
	  }else{
		return "No Grades";
	  }
	}

	async function login(username, password){
	  var isGoodLoginInfo = await get_notes(username, password, true);
	  if(isGoodLoginInfo == true){
		return "Success";
	  }else{
		return "Error";
	  }
	}

	async function get_notes(username, password, loginOnly){
	  try{
		var value_to_return;
		const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
		const page = (await browser.pages())[0];

		await page.setDefaultNavigationTimeout(0);

		await page.setRequestInterception(true);

		page.on('request', request => {
		  if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font')
			request.abort();
		  else
			request.continue();
		});

		await page.goto('https://lyc-chrestien-de-troyes.monbureaunumerique.fr/');

		await page.evaluate(()=>document.querySelector('.fo-connect__link').click());

		const mbn_student_menu = 'button';
		await page.waitForSelector(mbn_student_menu);
		await page.click(mbn_student_menu);

		await page.evaluate(()=>document.querySelector('#idp-REIMS-ATS_parent_eleve').click());
		await page.evaluate(()=>document.querySelector('#memo_non').click());

		const mbn_submit = '#button-submit';
		await page.waitForSelector(mbn_submit);
		await page.click(mbn_submit);

		await page.waitForNavigation();

		await page.type('#user', username);
		await page.type('#password', password);

		await page.evaluate(()=>document.querySelector('#bouton_connexion').click());
		await page.waitForNavigation();
		if(loginOnly == true){
		  if((await page.url()).indexOf("CTLrrorMsg=Identifiant%20ou%20mot%20de%20passepasse%20incorrect") > -1){
			return false;
		  }else{
			return true;
		  }
		}
		if((await page.url()).indexOf("CTLrrorMsg=Identifiant%20ou%20mot%20de%20passepasse%20incorrect") > -1){
		  return "WL";
		}
		await page.waitForNavigation();
		await page.evaluate(()=>document.querySelector('[href="/kdecole/activation_service.jsp?service=USER_8"]').click());

		await delay(3000);

		const page2 = (await browser.pages())[1];

		await page2.setRequestInterception(true);

		page2.on('request', request => {
		  if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font')
			request.abort();
		  else
			request.continue();
		});

		page2.on('requestfinished', async req => {
			var resText = await req.response().text();
			try {
			  let value = JSON.parse(resText);
			  if (value.nom === "DernieresNotes") {
				value_to_return = resText;
			  }
			} catch (e) {
				//console.log("not JSON");
			}
		});
		await page2.waitForSelector('[onclick="GInterface.Instances[1]._surToutVoir(10)"]');
		await page2.evaluate(()=>document.querySelector('[onclick="GInterface.Instances[1]._surToutVoir(10)"]').click());
		await delay(2000);
		// await page2.evaluate(()=>document.querySelector('.ibe_iconebtn:nth-child(3)').click());
		// await page.evaluate(()=>document.querySelector('[href="https://cas.monbureaunumerique.fr/saml/Logout?service=https%3A%2F%2Flyc-chrestien-de-troyes.monbureaunumerique.fr%2Flogout"]').click());
		await browser.close();
		return value_to_return;
	  }catch(e) {
		return e;
	  }
	}

app.use(bodyParser.json());
app.use('/.netlify/functions/server', serv);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);

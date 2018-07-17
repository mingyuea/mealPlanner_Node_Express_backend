const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const assert = require('assert');
const bcrypt = require('bcrypt');

const dbUrl = process.env.MONGODB_URI || 'mongodb://mingyue:Secure1@ds018558.mlab.com:18558/expressmp';
const dbName = 'expressmp';
const collName = 'mealPlanner';
const saltRounds = 15;

const app = express();

MongoClient.connect(dbUrl, (err, client) => {
	if(err) console.log(err);

	db = client.db(dbName);
});

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
	res.send('Express is running');
});


app.post('/login', (req, res) => {  //handles app login 
	let uName = req.body.username;
	let passText = req.body.password;
	let searchObj = {};
	searchObj['username'] = uName;

	db.collection(collName).find(searchObj).toArray((err, result) => {
		if(err) return err;

		if(result.length == 0){
			res.send({"login": false});
		}
		else{
			let hash = result[0].password;
			
			bcrypt.compare(passText, hash).then(passBool => {
				if(passBool){
					res.send({"login": true, "meals": result[0].meals});
				}
				else{
					res.send({"login": false});
				}
			});	
		}
	});
});


app.post('/update', (req, res) => {  //handles schedule update
	let uName = req.body.username;
	let mealObj = req.body.meals;
	let searchObj = {};
	let updateObj = {};
	searchObj["username"] = uName;
	updateObj["meals"] = mealObj;

	let updateSched = db.collection(collName).findOneAndUpdate(searchObj, {$set: updateObj}, {
		returnNewDocument: true,
		upsert: true
	}, (err, dbRes) => {
		assert.equal(null, err);
		
	});
	res.send(true);
});


app.post('/signup', (req, res) => {  //handles new user signup
	
	let uName = req.body.username;
	let passText = req.body.password;
	let uObj = {};
	uObj["username"] = uName;
	uObj["meals"] = req.body.meals;

	let userFree = db.collection(collName).find(uObj).toArray((err, results) =>{
		if(err) return err;

		let insertBool;
		if(results.length > 0){
			insertBool = false;
			res.send({'openName': false});
		}
		else{
			bcrypt.genSalt(saltRounds, (err, salt) => {
				bcrypt.hash(passText, salt, (err, hash) => {
					uObj['password'] = hash;

					col.insertOne(uObj, (err, r) => {
						if(err) return err;
						assert.equal(1, r.insertedCount);
						insertBool = true;
						res.send({'openName': true});
					});
				});
			});
		}
	});
});
 
app.listen(process.env.PORT || 5004, () => 
	console.log('app is lisenting on port 5004')
);
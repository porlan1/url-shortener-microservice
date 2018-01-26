const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

var app = express();
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var urlSchema = new mongoose.Schema({
	original_url: String,
	short_url: String
  });
mongoose.model('Url', urlSchema);
var Url = mongoose.model('Url');


app.use(express.static(__dirname));

app.get(/^\/(?!new).*$/, function(req, res){
	var requestURL = req.protocol + '://' + req.get('host') + req.url;
	var urlObject = Url.findOne({short_url: requestURL}, {original_url: 1}).exec(
		function(err, doc) {
    		if (doc){
				res.redirect(doc.original_url);
    		} else {
      			res.status(400).send('Invalid URL!');
    		};
		});
});

app.get('/new/:url*', (req, res, next)=>{
	var url = req.params['url'] + (req.params['0']? req.params['0']:'');
	var requestURL = req.protocol + '://' + req.get('host') + '/';
	if (isURL(url)) {
		var newURL = new Url({
		original_url: url,
		short_url: getShortUrl(requestURL)
		});
		newURL.save((err, newEntry, numAffected)=>{
			if(err){ 
				console.log(err);
      			res.status(500).send('short URL for ' + url + ' already set!'); 
    		} else {
    			res.json(newEntry);
    		}
		})
	} else {
		res.status(500).send(url + ' is an invalid URL!');
	}
});

var server = app.listen(4000);

function getShortUrl(requestURL) {
	var host = server.address().address;
    var port = server.address().port;
    var randomIndex = Math.ceil((Math.random())*25-0.5);
	var shortURL = requestURL + letters[randomIndex];
	while (Url.find({short_url: shortURL}).count() > 0) {
		randomIndex = Math.ceil((Math.random())*25-0.5);
		shortURL += letters[randomIndex];
	}
	return shortURL;
}

function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str);
}

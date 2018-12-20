var http = require("http");
var express = require('express');
var bodyParser = require('body-parser');
console.log("Started server");

var router = express();

var myServer = http.createServer(router);

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.static(__dirname + "/client"));

router.get('/*', function(req, res){
   res.send("<p> This is the whole things </p>"); 
});

myServer.listen(9100, '0.0.0.0');
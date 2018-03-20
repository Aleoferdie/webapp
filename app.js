// Servidor Node

var express = require('express');
var app = express();
var path = require('path');
var http = require('http');
var fs = require('fs');
var util = require('util');
var querystring = require('querystring');
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({ extended: false });
var maxData = 20 * 1024 * 1024; // 20 MB
var pug = require('pug');  		// Declaramos que vamos a emplear plantillas PUG
var port = process.env.PORT || 8080;
var logger = require('./logger');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(logger);

app.use(express.static('public')); // igual es public...

app.set('view engine', 'pug'); // busca plantillas PUG para su renderización en la carpeta views/

app.use(express.static('public')); // busca contenido en la carpeta especificada (imágenes, estilos, js, etc.)



console.log('Servidor escuchando en el puerto ' + port);

server.listen(port);
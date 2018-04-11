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
var MongoClient = require('mongodb').MongoClient;
//var uri = 'mongodb://localhost:27017/';
var database = null;
var uri = 'mongodb://Aleoferdie:<choky666_>@webapp-shard-00-00-c05al.mongodb.net:27017,webapp-shard-00-01-c05al.mongodb.net:27017,webapp-shard-00-02-c05al.mongodb.net:27017/test?ssl=true&replicaSet=Webapp-shard-0&authSource=admin';

// app.use(logger);

app.use(express.static('public'));

app.set('view engine', 'pug'); // busca plantillas PUG para su renderización en la carpeta views/

app.use(express.static('public')); // busca contenido en la carpeta especificada (imágenes, estilos, js, etc.)

app.get('/', function(request, response) {
	response.render('chat');
});

MongoClient.connect(uri, function(err, db) {
	if (err) {
		throw err;
	} else {
		console.log('Database created');
		database = db.db('chat');
	}
   const collection = client.db("test").collection("devices");
   client.close();
});

io.on('connection', function(client) {
	//console.log('Client Connected...');
	client.on('comprueba usuario', function(nick){
		database.collection('users').find({activo: true}).toArray(function(err,result){
			if (err) {
				throw err;
				console.log(err);
			}
			if (result[9] != undefined) {
				client.emit('sala llena',nick);
			} else {
				database.collection('users').find({nickname: nick}).toArray(function(err,result){
					if (err) {
						throw err;
					}
					if (result[0] != undefined) {
						if (result[0].activo == true){ 
							client.emit('usuario erroneo',nick);
						} else {
							client.emit('reconnect',nick);
						}
					} else {
						client.emit('usuario ok',nick);
					}
				});
			}
		});
	});

	client.on('unir',function(nick){
		client.nickname = nick;
		var query = {nickname: nick, escribiendo: false, activo: true};
		database.collection('users').insertOne(query,function(err,result){
			if (err) {
				throw err;
				console.log(err);
			} else {
				console.log(client.nickname + ' se ha conectado.');
				RefrescarUsuarios();
			}
		});
		client.broadcast.emit('mensajes','<div><p class="text-center" style="color: darkgray;"><i><small>'+client.nickname+' se ha conectado</small></i></p></div>');

	});

	client.on('disconnect', function(){
		if (client.nickname != undefined || client.nickname == null || client.nickname == ''){
			var query = {nickname: client.nickname};
			database.collection('users').updateOne(query,{$set: {activo: false, escribiendo: false}},function(err,result){
				if (err) {
					throw err;
					console.log(err);
				} else {

				}
			});
			var mensaje = '<div><p class="text-center"><i>' + client.nickname + ' se ha desconectado</i></p></div>';
			client.broadcast.emit('mensajes',mensaje);
		}
	});

	client.on('mensajeschat', function(datos) {
		console.log(datos.info);
		client.broadcast.emit('mensajeschat', datos);
	});
});

console.log('Servidor escuchando en el puerto ' + port);

//app.listen(port);

server.listen(port);

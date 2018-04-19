// Servidor Node
var express = require('express');
var app = express();
var pug = require('pug');  		// Declaramos que vamos a emplear plantillas PUG
var port = process.env.PORT || 8080;
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var MongoClient = require('mongodb').MongoClient;
var database;
var timer;
var num_mensajes = 256;
var t_inactive = 20000; // Tiempo en ms de inactividad.
var uri = 'mongodb://Aleoferdie:choky666@webappchat-shard-00-00-cy3ua.mongodb.net:27017,webappchat-shard-00-01-cy3ua.mongodb.net:27017,webappchat-shard-00-02-cy3ua.mongodb.net:27017/test?ssl=true&replicaSet=WebappChat-shard-0&authSource=admin';

MongoClient.connect(uri,function(err,db){
	if (!err) {
		console.log('Database created...')
		database = db.db('chat');
	} else {
		throw err;
	}
});

app.set('view engine', 'pug'); // busca plantillas PUG para su renderización en la carpeta views/

app.use(express.static('public')); // busca contenido en la carpeta especificada (imágenes, estilos, js, etc.)

app.get('/',function(request, response) {
	response.render('chat2');
});

io.on('connection', function(client) {

	//setInterval(function() {
	//	listaUsuarios(client.nickname);
	//}, 5000);

	client.on('nuevo usuario', function(nombre){
		database.collection('users').find({online: true}).toArray(function(err, result){
			if (err) {
				throw err;
			}
			if (result[9] != undefined) { // Comprueba que el número de usuarios online no es 10
				client.emit('sala llena',nombre);
			} else {
				database.collection('users').find({nickname: nombre}).toArray(function(err, result){
					if (err) {
						throw err;
					}
					if (result[0] != undefined) { // Si da resultado es que el nickname está en la db.
						if (result[0].online == true){   // Query con el nick introducido comprueba si online
							client.emit('wrong nick');
						} else {						// Si no está online se reconecta.	
							client.emit('reconnect',nombre);
						}
					} else {
						client.emit('nick ok',nombre);
					}
				});
			}
		});
	});

	client.on('unir',function(nombre){
		client.nickname = nombre;
		var col = 'rgb(';
		for (var i = 0; i < 3; i++){
			if (i == 2){
				col = col + '' + 10 * Math.floor((Math.random() * 20)) + ')';
			} else {
				col = col + '' + 10 * Math.floor((Math.random() * 20)) + ',';
			}
		}
		var fecha = new Date();
		database.collection('users').insertOne({nickname: nombre, color: col, escribiendo: false, online: true, ultima: fecha},
												function(err,result){
			if (err) {
				throw err;
			} else {
				console.log(client.nickname + ' se ha conectado.');
				listaUsuarios(nombre);
			}
		});
		client.broadcast.emit('chatarea','<div class="container-fluid"><p class="bg-light text-center" style="color: darkgray;"><i><small>' +
							  client.nickname + ' se ha unido</small></i></p></div>');
		actualizaChatarea(nombre);  // Se actualiza el chat para que muestre los mensajes antiguos
	});

	client.on('reconnection', function(nombre){
		client.nickname = nombre;
		var fecha = new Date();
		database.collection('users').updateOne({nickname: client.nickname},
											   {$set: {escribiendo: false, online: true, ultima: fecha}},
											   function(err, result){ 
			if (err) {
				throw err;
			} else {
				console.log(nombre + ' se ha conectado.');
			}
			listaUsuarios(nombre);
			actualizaChatarea(nombre);
		});
		client.broadcast.emit('chatarea','<div class="container-fluid"><p class="bg-light text-center" style="color: darkgray;"><i><small>' +
							  nombre + ' se ha conectado</small></i></p></div>');
	});

	client.on('disconnect', function(){
		var fecha = new Date();
		if (client.nickname != undefined){  // Cuando se desconecte un usuario, se cambiará su ultima conexión en este instante.
			database.collection('users').updateOne({nickname: client.nickname},
												   {$set: {escribiendo: false, online: false, ultima: fecha}},
												   function(err, result){
				if (err) {
					throw err;
				} else {
					console.log(client.nickname + ' se ha desconectado');
					listaUsuarios(); //Para que actualice la lista de usuarios de inmediato.
				}
			});
			var mensaje = '<div class="container-fluid"><p class="bg-light text-center" style="color: darkgray;"><i><small>' +
						  client.nickname + ' se ha desconectado</small></i></p></div>';
			client.emit('disconnection', client.nickname);
			client.broadcast.emit('chatarea', mensaje);
		}
	});

	client.on('nuevo mensaje', function(datos){
		var fecha = new Date();
		var mensaje;
		var mimensaje;
		if (fecha.getMinutes() > 9){ // Si los minutos son de 1 unidad, se le añade un 0 para mejor representación.
			mensaje = '<div class="bg-light d-flex flex-row"><p class="text-left"><small>' +
					  fecha.getHours() + ':' + fecha.getMinutes() + '</p><p class="text-left"><b style="color:' +
					  datos.color + ';">' + datos.nickname + '</b>: ' + datos.mensaje + '</small></p></div>';
			mimensaje = '<div class="bg-light d-flex flex-row-reverse"><p class="text-right"><small>' +
						fecha.getHours() + ':' + fecha.getMinutes() + '</p><p class="text-right" style="color:black;">' +
						datos.mensaje + '</small></p></div>';
		} else {
			mensaje = '<div class="bg-light d-flex flex-row"><p class="text-left"><small>' +
					  fecha.getHours() + ':0' + fecha.getMinutes() + '</p><p class="text-left"><b style="color:' +
					  datos.color + ';">' + datos.nickname + '</b>: ' + datos.mensaje + '</small></p></div>';
			mimensaje = '<div class="bg-light d-flex flex-row-reverse"><p class="text-right"><small>' +
					  fecha.getHours() + ':0' + fecha.getMinutes() + '</p><p class="text-right" style="color:black;">' +
					  datos.mensaje + '</small></p></div>';
		}
		client.emit('chatarea',mimensaje);
		client.broadcast.emit('chatarea',mensaje);
		client.broadcast.emit('tono',mensaje);
		database.collection('mensajes').insertOne({nickname: datos.nickname, mensaje: datos.mensaje, fecha: fecha},
													function(err,result){
			if (err) {
				throw err;
			}
		});
		database.collection('users').updateOne({nickname: datos.nickname},{$set: {ultima: fecha, escribiendo: false}},
												function(err, result){ // Indicamos que el usuario ya no escribe
			if (err) {
				throw err;
			}
		});
	});

	client.on('escribiendo', function(nombre){
		var fecha = new Date();
		database.collection('users').updateOne({nickname: nombre}, {$set: {escribiendo: true}},
											   function(err,result){
			if (err) {
				throw err;
			}
			listaUsuarios(nombre);
		});
	});

	client.on('sin escribir', function(nombre){
		database.collection('users').updateOne({nickname: nombre}, {$set: {escribiendo: false}},
											   function(err,result){
			if (err) {
				throw err;
			} else {
				listaUsuarios(nombre);
			}
		});
	});

	function listaUsuarios(nombre){
		database.collection('users').find().sort({online:-1}).toArray(function(err,result) {
			if (err) {
				throw err;
			}
			var users = '';
			var ultima = '';
			var now = new Date();
			for (var i = 0; i < result.length; i++){
				
				if (result[i].online == false) {
					var delta = now.getTime() - result[i].ultima.getTime(); // Devuelve los ms desde 1/1/1970
					var delta_day = Math.floor(delta / (1000 * 60 * 60 * 24));

					if (delta_day >= 1 || result[i].ultima.getDate() != now.getDate()) { // DÍAS
						if (delta_day < 2) { // Comprueba si fue ayer.
							if (result[i].ultima.getMinutes() > 9) {
								ultima = 'ayer a las ' + result[i].ultima.getHours() + ':' + result[i].ultima.getMinutes();
							} else {
								ultima = 'ayer a las ' + result[i].ultima.getHours() + ':0' + result[i].ultima.getMinutes();
							}
						} else if (delta_day < 7) { // Comprueba si fue hace menos de una semana
							if (result[i].ultima.getMinutes() > 9) {
								ultima = 'hace ' + delta_day + ' días a las ' +
										 result[i].ultima.getHours() + ':' + result[i].ultima.getMinutes();
							} else {
								ultima = 'hace ' + delta_day + ' días a las ' +
										 result[i].ultima.getHours() + ':' + result[i].ultima.getMinutes();
							}
						} else {
							switch (result[i].ultima.getMonth()) { // Obtiene el mes del año
								case 0:
									var mes = 'enero';
									break;
								case 1:
									var mes = 'febrero';
									break;
								case 2:
									var mes = 'marzo';
									break;
								case 3:
									var mes = 'abril';
									break;
								case 4:
									var mes = 'mayo';
									break;
								case 5:
									var mes = 'junio';
									break;
								case 6:
									var mes = 'julio';
									break;
								case 7:
									var mes = 'agosto';
									break;
								case 8:
									var mes = 'septiembre';
									break;
								case 9:
									var mes = 'octubre';
									break;
								case 10:
									var mes = 'noviembre';
									break;
								case 11:
									var mes = 'diciembre';
									break;											
							}
							ultima = 'el ' + result[i].ultima.getDate() + ' de ' + 
									  mes + ' de ' + 
									  result[i].ultima.getFullYear();
						}
					} else if ( (delta / (1000 * 60)) < 60 )  {
						ultima = 'hace ' + Math.floor(delta / (1000 * 60)) + ' minutos';
					} else {
						if (result[i].ultima.getMinutes() > 9) {
								ultima = 'hoy a las ' + result[i].ultima.getHours() + ':' + result[i].ultima.getMinutes();
						} else {
								ultima = 'hoy a las ' + result[i].ultima.getHours() + ':0' + result[i].ultima.getMinutes();
						}
					}
				}

				if (result[i].online == true){
					if (result[i].escriendo == true) {
						if (result[i].nickname == nombre) {
							var linea = '<p><b><i class="text-success"><small>' + result[i].nickname +
							 	 		' (TÚ) está escribiendo...</small></i></b></p>'; // Indica quién eres en la lista de usuarios
						} else {
							var linea = '<p><i class="text-success"><small>' + result[i].nickname +
								  		' está escribiendo...</small></i></p>';
						}
					} else {
						if (result[i].nickname == nombre) {
							var linea = '<p><b class="text-success"><small>' + result[i].nickname +
							 	 		' (TÚ)</small></b></p>';
						} else {
							var linea = '<p class="text-success"><small>' + result[i].nickname +
								  		'</small></p>';
						}
					}
				} else {
					var linea = '<p class="text-muted"><small>' + result[i].nickname + ' (ult. vez ' + 
								ultima + ')</small></p>';
				}
				users = users + linea;   // Va concatenando cada usuario para crear un html con todos los usuarios.
			}
			client.emit('lista usuarios',users);
			client.broadcast.emit('lista usuarios',users);
		});
	}

	function actualizaChatarea(nombre) { 
		database.collection('mensajes').aggregate([
			{$lookup:{
				from: 'users',
				localField: 'nickname',
				foreignField: 'nickname',
				as: 'user'
			}}
		]).sort({fecha:1}).limit(num_mensajes).toArray(function(err,result){ // Combina ambas bases de datos, ordena por fecha y limita los resultados.
			if (err) {
				throw err;
			}
			var mensajes = '';
			var linea;
			for (var i = 0; i < result.length; i++) {
				if (result[i].nickname == nombre){  // Si es el mensaje del usuario actual se muestra de manera distinta
					if (result[i].fecha.getMinutes() < 10){
						linea = '<div class="bg-light d-flex flex-row-reverse"><p class="text-right"><small>' +
							  result[i].fecha.getHours() + ':0' + result[i].fecha.getMinutes() +
							  '</p><p class="text-right" style="color:black;">' + result[i].mensaje + '</small></p></div>';
					} else {
						linea = '<div class="bg-light d-flex flex-row-reverse"><p class="text-right"><small>' +
							  result[i].fecha.getHours() + ':' + result[i].fecha.getMinutes() +
							  '</p><p class="text-right" style="color:black;">'+result[i].mensaje+'</small></p></div>';
					}
				} else {
					if (result[i].fecha.getMinutes() < 10){
						linea = '<div class="bg-light d-flex flex-row"><p class="text-left"><small>' +
							  result[i].fecha.getHours() + ':0' + result[i].fecha.getMinutes() +
							  '</p><p class="text-left"><b style="color:' + result[i].user[i].color +
							  ';">' + result[i].nickname + '</b>: ' + result[i].mensaje + '</small></p></div>';
					} else {
						linea = '<div class="bg-light d-flex flex-row"><p class="text-left"><small>' +
							  result[i].fecha.getHours() + ':' + result[i].fecha.getMinutes() +
							  '</p><p class="text-left"><b style="color:' + result[i].user[i].color +
							  ';">' + result[i].nickname + '</b>: ' + result[i].mensaje + '</small></p></div>';
					}
				}
				mensajes = mensajes + linea; // Va concatenando cada mensaje creando un html con todos los mensajes
			}
			client.emit('actualiza chat',mensajes);
		});
	}
});

server.listen(port);
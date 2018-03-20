// Cliente websocket

var socket = io.connect();

socket.on('connect', function(datos) {
	//$('#estado').html('Te has conectado al chat');
	nickname = prompt('Cual es tu nickname?');
	socket.emit('unir', nickname);
	socket.nickname = nickname;
	console.log(socket.nickname);
});

socket.on('mensajeschat', function(datos) {
	//alert('Hay que introducir esta información en el chat: ' + datos.info);
	$(document).ready(function() {
		$('#chatarea').append('<span class="mx-2">' + datos.info + '<br>');
	});
});

$(document).ready(function() {
	$('.btn').on('click', function(e) {
		var mensaje = socket.nickname + ': ' + $('#comment').val();
		socket.emit('mensajeschat', {info: mensaje});
		$('#chatarea').append('<span class="mx-2">' + mensaje + '<br>');
		$('#comment').val('');
	});
});

socket.on('unir', function(nombre) {
	//alert('Se ha unido ' + nombre);
	$(document).ready(function() {
		$('#chatarea').append('<span class="mx-2">Se ha unido '  + nombre + '<br>');
	});
});

socket.on('borrar usuario', function(nombre) {
	//alert('Se ha desconectado el usuario ' + nombre);
	$(document).ready(function() {
		$('#chatarea').append('<span class="mx-2>"Se ha desconectado '  + nombre + '<br>');
	});
});


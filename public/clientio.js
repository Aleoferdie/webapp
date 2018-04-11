// Cliente websocket

var socket = io.connect();

socket.on('connect', function(datos) {
	nickname = null;
	while (nickname == null || nickname == '' || nickname == undefined){
		nickname = prompt('Introduce tu nickname');
	}
	socket.emit('comprueba usuario',nickname);
});

socket.on('usuario erroneo', function(datos) {
	nickname = null;
	while (nickname == null || nickname == '' || nickname == undefined){
		
		nickname = prompt('El nickname que ha escogido no está libre. Escoja otro por favor.');
	}
	socket.emit('comprueba usuario',nickname);
});

// En caso de nickname correcto
socket.on('usuario ok',function(nickname){
	socket.emit('unir',nickname);
	socket.nickname = nickname;
	$('#id').text(nickname);
});

socket.on('reconnect',function(nickname){
	socket.emit('reconecta',nickname);
	socket.nickname = nickname;
	$('#id').text(nickname);
});

socket.on('sala llena', function(datos) {  // Se alcanza el número máximo de usuarios en la sala.
	$('#contenido').html('<p>La sala del chat está llena.</p>');
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
var socket = io.connect({'sync disconnect on unload':true});

socket.on('connect', function(datos) {
	nickname = '';
	while (nickname == null || nickname == '' || nickname == undefined) {
		nickname = prompt('Introduce tu nickname');
	}
	socket.emit('nuevo usuario',nickname);
});

socket.on('wrong nick', function() {
	nickname = '';
	while (nickname == null || nickname == '' || nickname == undefined) {
		nickname = prompt('El nickname está en uso, escoge otro por favor.');
	}
	socket.emit('nuevo usuario',nickname);
});

socket.on('nick ok',function(datos) {
	socket.emit('unir',datos.nickname);
	socket.nickname = datos.nickname;
	socket.color = datos.color;
	$('#yournick').html('<small class="text-secondary">TU NICK: <div class="text-primary">' + datos.nickname + '</div></small>');
});

socket.on('reconnect',function(datos) {
	socket.emit('reconnection',datos.nickname);
	//socket.emit('sin escribir',nickname);
	socket.nickname = datos.nickname;
	socket.color = datos.color;
	$('#yournick').html('<small class="text-secondary">TU NICK: <div class="text-primary">' + datos.nickname + '</div></small>');
	//alert('Bienvenido de vuelta!');
});

//socket.on('disconnection', function(nickname)) {
	//socket.nickname = nickname;
//	$('#contenido').html('<p>Se ha desconectado con éxito</p>');
//}

socket.on('sala llena', function(datos) {
	$('#error').html('<p style="padding: 3em;">Para chatear, inicia sesión por favor</p>');
	alert('Lo sentimos, la sala está llena. Inténtalo más tarde.');
});

socket.on('inactividad', function(datos) {
	$('#error').html('<p style="padding: 3em;">Para chatear, inicia sesión por favor</p>');
	alert('Se ha cerrado tu sesión por inactividad');
});

socket.on('lista usuarios', function(users) {
	$('#users').html(users);
});

socket.on('actualiza chat', function(chatarea) {
	$('#chatarea').html(chatarea);
});

socket.on('chatarea',function(chatarea) {
	$('#chatarea').append(chatarea);
});

//socket.on('tono', function(datos) {
//	$('#tone').play();
//});

$(document).ready(function (){

	$('#boton').on('click', function(e) {
		if ($('#texto').val() != ''){
			var fecha = new Date();
			socket.emit('nuevo mensaje',{nickname: socket.nickname, mensaje:$('#texto').val(), color: socket.color});
			$('#texto').val('');
		}
	});

	$('#botonfoto').on('click', function(e) {
		var url = '';
		while (url == undefined || url == null || url == '') {
			url = prompt('Introduce la ruta a la imagen');
			var foto = '<img src="' + url + '" height="75" width="75">';
			var fecha = new Date();
			socket.emit('nuevo mensaje',{nickname: socket.nickname, mensaje: foto});
			$('#texto').val('');
		}
	});

	$('#texto').on('keypress', function(e) { // Código del enter es el 12. Al pulsar se envía el mensaje.
		if (e.keyCode == 13) {
        	if ($('#texto').val() != ''){
				socket.emit('nuevo mensaje',{nickname: socket.nickname, mensaje:$('#texto').val(), color: socket.color});
				$('#texto').val('');
			}
       	} else if (($('#texto').val() != '') || ($('#texto').val() != null) || ($('#texto').val() != undefined))  {
			socket.emit('escribiendo',nickname);
	   	} else if (($('#texto').val() == '') && e.keyCode == 8) {
	   		socket.emit('sin escribir',nickname);
	   	} else {
	   		socket.emit('sin escribir',nickname);
	   	}
	});

	$('#emoji').on('click',function(){
		$('#emoji').val($('#texto').val());
	});
});
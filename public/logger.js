module.exports = function(request,response,next){
	var start = +new Date();
	var stream = process.stdout;
	var url = request.url;
	var method = request.method;

	response.on('finish', function(){
		var duration = +new Date() - start;
		var message = method + ' en la URL ' + url + 
		'\nha tenido una duracion de ' + duration +
		' ms. \n\n';
		stream.write(message);
	});
	next();
}
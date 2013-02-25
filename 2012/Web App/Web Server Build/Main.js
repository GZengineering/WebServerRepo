function MainApp(collection, fs, URL, formidable, request, response)
{

	var path = URL.parse(request.url,true).pathname;
	var FieldQuery = URL.parse(request.url,true).query;

	if(path=='/MainAdmin')
	{			
		fs.readFile('./MainAdmin.html', function (err, html) 
		{
			response.writeHead(200, {"Content-Type": "text/html"});			  
			response.write(html);
			response.end();
			console.log('loading Admin Main App');
		})

		return;
	}
	
	if(path=='/MainGuest')
	{			
		fs.readFile('./MainGuest.html', function (err, html) 
		{
			response.writeHead(200, {"Content-Type": "text/html"});			  
			response.write(html);
			response.end();
			console.log('loading Guest Main App');
		})

		return;
	}
	

}

exports.MainApp = MainApp
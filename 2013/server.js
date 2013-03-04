//server.js

var http = require("http"),
	url = require("url"),
	port = 80;
	mongo = require('mongodb'),
	Server = mongo.Server,
	MongoServer = new Server('localhost', 27017, 
		{
			auto_reconnect: true
		}),
	Db = mongo.Db,
	dbName = 'GZ',
	collectionName = 'DataBase',
	db = new Db(dbName, MongoServer);
var OpenDB, 
	DBCollection;


/**
  * Request Handlers
 */
var requestHandlers = require("./requestHandlers");
var handle = {};
handle["/"] = requestHandlers.Home;
handle["/start"] = requestHandlers.start;
handle["/upload"] = requestHandlers.upload;
handle["/show"] = requestHandlers.show;
handle["/Inventory"] = requestHandlers.Inventory;
handle["/Home"] = requestHandlers.Home;
handle["/SpecManager"] = requestHandlers.SpecManager;

db.open(function(error, db)
	{
		OpenDB = db;
		db.collection(collectionName, 
			function(error, collection)
			{
				DBCollection = collection;
				console.dir(MongoServer);
				console.log('\n\n\n\t' + '\x1b[31;1m' + 'The server has started on' + '\x1b[32;1m Port: ' + port + '\n\n\n' + '\033[0m');
				console.log('\n\nDatabase used : \x1b[33;1m\''+dbName+'\' \033[0m \t Collection used: \x1b[33;1m\''+collectionName+'\'\033[0m\n');
			})
	});	

function start(route, handle) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    route(handle, pathname, response, request, DBCollection, url);
  }

  http.createServer(onRequest).listen(port);
}

function route(handle, pathname, response, request, collection, url) {
  console.log("About to route a request for " + pathname);
  if (typeof handle[pathname] === 'function') {
    handle[pathname](response, request, collection, url);
  } else {
    console.log("No request handler found for " + pathname);
    response.writeHead(404, {"Content-Type": "text/html"});
    response.write("404 Not found");
    response.end();
  }
}

start(route, handle);
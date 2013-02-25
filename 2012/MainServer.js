

var formidable = require('formidable');
var http = require("http");
var sys = require("util");
var fs = require('fs');
var URL = require('url');
var server_port = 80;

var Tester;
var Country;
var DataTitle;
var path;

var mongo = require('mongodb');
var Server = mongo.Server;

var MongoServer = new Server('localhost', 27017, {auto_reconnect: true} );
var Db = mongo.Db;

var db = new Db('GoalZeroDataBase', MongoServer);

var OpenDB, DBcollection;



db.open(function(err, db){OpenDB = db; db.collection('DataBase', function(err, collection)
	{
		DBcollection = collection;
		console.dir(MongoServer);
		console.log('\n\n\tMain Server Has Started. Good Luck. (port: ' + server_port + ')');
	})});



var InventoryServer = require('./Inventory');
var DataServer = require('./DataPortal');
var GridServer = require('./GridServer');
var TaskServer = require('./Tasks');
var Main = require('./Main');


			function onRequest(request, response) 
			{			
				path = URL.parse(request.url).pathname;
			
				if(path == '/InventoryInterface')
				{
				InventoryServer.Inventory(DBcollection, fs, URL, formidable, request, response);
				return;
				}
				
				if(path == '/DataPortal')
				{
				DataServer.DataPortal(DBcollection, fs, URL, formidable, request, response);
				return;
				}				
				
				if(path =='/GZgrid')
				{
				GridServer.GridServer(DBcollection, fs, URL, formidable, request, response);
				return;
				}
				
				if(path == '/EETasks')
				{
				TaskServer.TaskServer(OpenDB, DBcollection, mongo, fs, URL, formidable, request, response);
				return;
				}
				
				if(path=='/MainAdmin'||path=='/MainGuest')
				{
				Main.MainApp(DBcollection, fs, URL, formidable, request, response)
				return;
				}

				response.writeHead(200, {"Content-Type": "text/plain"});					
				response.write('Sorry, The URL is not valid');
				response.end();
				return;
				
			}
			
			http.createServer(onRequest).listen(server_port);
			
			
			
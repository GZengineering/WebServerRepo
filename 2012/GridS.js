
var http = require("http");
var sys = require("util");
var fs = require('fs');
var URL = require('url');
var formidable = require('formidable');
var GridStore = require('mongodb').GridStore;
var ObjectID = require('mongodb').ObjectID;
var gridform = require('gridform');

var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('GoalZeroChargeTimes', server);
var dbOpen;




var path;
var FieldQuery;
var Time;

			function onRequest(request, response)
			{
			
			path = URL.parse(request.url).pathname;
			FieldQuery = URL.parse(request.url,true).query;			

						if(path=='/ChargeTimesAdministrator')
						{
							fs.readFile('./GridAdministator.html', function (err, html) 
							{
							  response.writeHead(200, {"Content-Type": "text/html"});			  
							  response.write(html);
							  response.end();
							  console.log('loading the web page');
							})
							return	
						}

			
						if(path=='/ChargeTimes')
						{
							fs.readFile('./Grid.html', function (err, html) 
							{
							  response.writeHead(200, {"Content-Type": "text/html"});			  
							  response.write(html);
							  response.end();
							  console.log('loading the web page');
							})
							return	
						}	


					if(path=='/ChargeTimesGetStore')
					{

					db.open(function(err, db) 
					{					
					db.collection('Devices', function(err, collection)
						{					
						collection.find().toArray(function(err,dox) 
							{							
							response.writeHead(200, {"Content-Type": "application/json"});					
							response.write(JSON.stringify(dox));
							response.end();							
							db.close();							
							});
						})				
					})					

					return						  
						  
					}
					
					
					if(path=='/ChargeTimesSyncStore')
					{
					
					
					request.on('data',function(chunk)
						{
						
								var StoreData = JSON.parse(chunk.toString());
											
									db.open(function(err, db) 
									{					
									db.collection('Devices', function(err, collection)
										{					
										collection.remove(function(err, result)
											{
											collection.insert(StoreData,function(err, message)
												{
												
													response.writeHead(200, {"Content-Type": "text/plain"});					
													response.write('data has been synced');
													response.end();	
													db.close();													
												})
												
											
											
											}) 

										})				
									})							

						})							

					return						  
						  
					}

			return		

			}
			

			

http.createServer(onRequest).listen(8877);

console.log("Server has started.");

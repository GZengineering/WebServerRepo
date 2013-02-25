
var formidable = require('formidable');
var http = require("http");
var sys = require("util");
var fs = require('fs');
var URL = require('url');

var mongo = require('mongodb');
var Server = mongo.Server;

var MongoServer = new Server('localhost', 27017, {auto_reconnect: true, socketOptions:{keepAlive:100}} );
var Db = mongo.Db;

var db = new Db('test', MongoServer);

	function onRequest(request, response) 
	{

	var path = URL.parse(request.url).pathname;
	var FieldQuery = URL.parse(request.url,true).query;
	
		if(!FieldQuery.hasOwnProperty('Event')&&path=='/UnitForm')
		{			
			fs.readFile('./UnitForm.html', function (err, html) 
			{
				response.writeHead(200, {"Content-Type": "text/html"});			  
				response.write(html);
				response.end();
				console.log('loading UnitForm App');
			})

			return;
		}
		
		if(!FieldQuery.hasOwnProperty('Event')&&path=='/UnitForm_PanelCharge')
		{			
			fs.readFile('./UnitForm_PanelCharge.html', function (err, html) 
			{
				response.writeHead(200, {"Content-Type": "text/html"});			  
				response.write(html);
				response.end();
				console.log('loading UnitForm App');
			})

			return;
		}
		
		if(!FieldQuery.hasOwnProperty('Event')&&path=='/UnitForm_AccessoryCharge')
		{			
			fs.readFile('./UnitForm_AccessoryCharge.html', function (err, html) 
			{
				response.writeHead(200, {"Content-Type": "text/html"});			  
				response.write(html);
				response.end();
				console.log('loading UnitForm App');
			})

			return;
		}

		if(FieldQuery.Event == 'FormSubmit')
		{	
					
			request.on('data',function(chunk)
			{			
				db.open(function(err, db)
				{
					db.collection('DataBase', function(err, collection)
					{						
						var UnitForm = JSON.parse(chunk.toString());
						
						collection.remove({DataType:'Technical Specs', 'UnitID':UnitForm.UnitType, 'UnitName':UnitForm.UnitName}).toArray(function(err, exists)
						{						
							if(exists.length)
							{
								response.writeHead(200, {"Content-Type": "text/plain"});					
								response.write('Entry Already Exists');
								response.end();
								db.close();
							}
							else
							{
								if(UnitForm.UnitType == 'Pack')
								{
									var BatterySpecs = UnitForm['Battery Specifications'][0];								
									UnitForm['Battery Specifications'][0]['Charge Capacity'] = (BatterySpecs['Nominal Cell Voltage']*BatterySpecs['Cells in Series'])*(BatterySpecs['Cell Capacity']*BatterySpecs['Series Sets in Parallel']);										
								}
														
								collection.insert(UnitForm, function(err, result)
								{
									response.writeHead(200, {"Content-Type": "text/plain"});					
									response.write('data has been synced');
									response.end();
									db.close()								
								})
							}							
						})
					}); 
				})				
			})							
			return;					  
				
		
		}
		
		if(FieldQuery.Event == 'GetSpecs')
		{
			db.open(function(err, db)
			{
				db.collection('DataBase', function(err, collection)
				{
					var data = new Object();
					
					collection.find({'DataType':'Technical Specs', 'UnitType':'Pack'}).toArray(function(err,Packs)
					{
						data['Packs'] = Packs;
						
						collection.find({'DataType':'Technical Specs', 'UnitType':'Accessory'}).toArray(function(err,Accessories)
						{
							data['Accessories'] = Accessories;
								
							collection.find({'DataType':'Technical Specs', 'UnitType':'Panel'}).toArray(function(err,Panels)
							{
								data['Panels'] = Panels;
									
								response.writeHead(200, {"Content-Type": "text/plain"});					
								response.write(JSON.stringify(data));
								response.end();
								db.close();	

								return;

							})								
						})
					})
				}); 
			})				
		}
		
		if(FieldQuery.Event == 'CheckEntry')
		{
			db.open(function(err, db)
			{
				db.collection('DataBase', function(err, collection)
				{
					collection.find({DataType:'Technical Specs', UnitID:FieldQuery.UnitID}).toArray(function(err, Item)
					{
								response.writeHead(200, {"Content-Type": "text/plain"});					
								response.write(JSON.stringify(Item));
								response.end();
								db.close();						
					
					})
				
				
				}); 
			})				
		}		

		
	}				
			
			
	http.createServer(onRequest).listen(8882);
			
	console.log('Unit Server has started');
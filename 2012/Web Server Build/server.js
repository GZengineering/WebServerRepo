var formidable = require('formidable');

var http = require("http");
var sys = require("util");
var fs = require('fs');
var URL = require('url');
var Tester;
var Country;
var DataTitle;
var path;
var page;


var mongo = require('mongodb'),
  Server = mongo.Server,
  Db = mongo.Db;

var server = new Server('localhost', 27017, {auto_reconnect: true});
var db = new Db('GoalZeroPortal', server);
	



			function onRequest(request, response) 
			{
			
			path = URL.parse(request.url).pathname;
			FieldQuery = URL.parse(request.url,true).query;	
			
			//--------------------------------------------------INITIAL LOAD------------------------------------
			
				if(path =="/Portal")
				{			
					fs.readFile('./Portal.html', function (err, html) 
					{
					  response.writeHead(200, {"Content-Type": "text/html"});			  
					  response.write(html);
					  response.end();
					  console.log('loading the web page');
					})				
				}
				
				  if (path=="/Upload") 
				  {


					fs.readFile('./Upload.html', function(err,html)
					{
					  response.writeHead(200, {"Content-Type": "text/html"});			  
					  response.write(html);
					  response.end();
					  console.log('loading the web page');
					});
				  }	


	
				  if (path=="/upload" && request.method.toLowerCase() == 'post') 
				  {
				  
				  
					// parse a file upload
					var form = new formidable.IncomingForm();
					form.parse(request, function(err, fields, files) 
					{
					
					var Name = fields.NameBox;
					var Country = fields.CountryBox;
					var DataTitle = fields.TitleBox;
					var Date = fields.DateBox;
					var Unit = fields.UnitBox;
					var SN = fields.SerialBox;

					fs.readFile(files.uploadedfile.path,function(err,dataBuffer)
						{
						
						db.open(function(err, db) 
							{
								db.collection('SherpaTesters', function(err, collection)
								{
									collection.find({name:Name, "Country":Country, 'DataTitle':DataTitle}).toArray(function(err,dox){

										if(dox.length)
										{
										db.close();										
										response.writeHead(200, {"Content-Type": "text/plain"});			  
										response.write('ERROR: Data from this User has already been submitted with the title: '+DataTitle +'. Please go back and change the Data title');
										response.end();											
										
										}
										else
										{
										collection.insert({name:Name, "Country":Country,'DataTitle':DataTitle, 'Unit':Unit, 'SN':SN, 'Date':Date, 'Data':dataBuffer.toString('ascii')});
																
										db.close();
										response.writeHead(200, {"Content-Type": "text/plain"});			  
										response.write('The File has been received and processed');
										response.end();
										
										}
									})
						
								});
						
							});
						});
					
					});
				  }
				
				
				
			//-------------------------------------------------RETRIEVE LIST OF COUNTRIES------------------------	
				
				if(path=="/GetCountry")
				{

					db.open(function(err, db) 
					{					
					db.collection('SherpaTesters', function(err, collection)
						{					
						collection.distinct('Country',function(err, list) 
							{							
							response.writeHead(200, {"Content-Type": "text/plain"});					
							response.write(list.toString());
							response.end();							
							db.close();							
							});
						})				
					})

				
				}
				
			//-------------------------------------------------RETRIEVE LIST OF COUNTRIES------------------------	
				
				if(path=="/GetTester")
				{
				Country = FieldQuery.Country;
					db.open(function(err, db) 
					{					
					db.collection('SherpaTesters', function(err, collection)
						{
						collection.distinct('name',{'Country':Country},function(err, list)
							{						
							response.writeHead(200, {"Content-Type": "text/plain"});							
							response.write(list.toString());
							response.end();							
							db.close();											
							})				
						})
					})
				}

			//-------------------------------------------------RETRIEVE LIST OF COUNTRIES------------------------	
				
				if(path=="/GetDataTitle")
				{				
				Tester = FieldQuery.Tester;
				Country = FieldQuery.Country;
				
					db.open(function(err, db) 
					{					
					db.collection('SherpaTesters', function(err, collection)
						{
						collection.distinct('DataTitle',{'Country':Country,'name':Tester},function(err, list)
							{						
							response.writeHead(200, {"Content-Type": "text/plain"});								
							response.write(list.toString());
							response.end();							
							db.close();											
							})				
						})
					})
				}
				
				if(path=="/GetRawData")
				{
				
				Tester = FieldQuery.Tester;
				Country = FieldQuery.Country;				
				DataTitle = FieldQuery.DataTitle;

				
					db.open(function(err, db) 
					{					
					db.collection('SherpaTesters', function(err, collection)
						{
						collection.findOne({'Country':Country,'name':Tester, 'DataTitle':DataTitle},function(err, doc)
							{						
							response.writeHead(200, {"Content-Type": "text/plain"});
							response.write(doc.Unit +'\t'+doc.SN+'\t'+doc.Date+'\n');
console.log(doc.Unit +'\t'+doc.SN+'\t'+doc.Date+'\n')
							response.write(doc.Data);
							response.end();							
							db.close();											
							})				
						})
					})
				}				
				
				
				
				
				
				

			console.log("Request received with the Path: " + path);

			}
			

			
			
http.createServer(onRequest).listen(8888);

console.log("Server has started.");

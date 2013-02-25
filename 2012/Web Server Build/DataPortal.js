

function DataPortal(collection, fs, URL, formidable, request, response)
{
	var SizeLimiter = 300000 //in bytes

	var Tester;
	var Country;
	var DataTitle;
	var path = URL.parse(request.url).pathname;
	var FieldQuery = URL.parse(request.url,true).query;	
			
			//--------------------------------------------------INITIAL LOAD------------------------------------
	
	if(!FieldQuery.hasOwnProperty('Event'))
	{			
		fs.readFile('./Portal.html', function (err, html) 
		{
			response.writeHead(200, {"Content-Type": "text/html"});			  
			response.write(html);
			response.end();
			console.log('loading the DataPortal Webb App');
		})
		return						
	}
	
	if (FieldQuery.Event=="UploadData") 
	{
		var form = new formidable.IncomingForm();
		
		form.parse(request, function(err, fields, files) 
		{					
			var Name = fields.NameBox;
			var Country = fields.CountryBox;
			var DataTitle = fields.TitleBox;
			var Date = fields.DateBox;
			var Unit = fields.UnitBox.split(',');
			var SN = fields.SerialBox.split(',');

			fs.readFile(files.UploadedFile.path,function(err,dataBuffer)
			{
				collection.find({'DataType':'ResultClass', name:Name, "Country":Country, 'DataTitle':DataTitle}).toArray(function(err,dox)
				{

					if(dox.length)
					{									
						response.writeHead(200, {"Content-Type": "text/plain"});			  
						response.write('ERROR: Data from this User has already been submitted with the title: '+DataTitle +'. Please go back and change the Data title');
						response.end();																					
					}
					else
					{						
						var RefinedData = dataBuffer.toString('ascii');
						var Inc = files.UploadedFile.size/SizeLimiter;
						
						if(Inc<1)
						Inc = 1;
						else
						Inc = Math.round(Inc);					
						
						var ProcessedData = {'Date':Date, Pack:Unit[0], PackSN:SN[0], Panel:Unit[1], PanelSN:SN[1], RawData:ProcessData(RefinedData.split('\n'),Inc)}
				
						collection.insert({'DataType':'ResultClass', name:Name, "Country":Country,'DataTitle':DataTitle, 'Data':ProcessedData});
						response.writeHead(200, {"Content-Type": "text/plain"});			  
						response.write('The File has been received and processed');						
						response.end();
											
					}
				})
			});					
		});					
		return
					
	}
				
				
				
			//-------------------------------------------------RETRIEVE LIST OF COUNTRIES------------------------	
				
	if(FieldQuery.Event=="GetCountry")
	{					
		collection.distinct('Country', {'DataType':'ResultClass'}, function(err, list) 
		{							
			response.writeHead(200, {"Content-Type": "text/plain"});					
			response.write(list.toString());
			response.end();													
		});
		return
	}
				
			//-------------------------------------------------RETRIEVE LIST OF COUNTRIES------------------------	
				
	if(FieldQuery.Event=="GetTester")
	{
		Country = FieldQuery.Country;

		collection.distinct('name',{'DataType':'ResultClass', 'Country':Country},function(err, list)
		{						
			response.writeHead(200, {"Content-Type": "text/plain"});							
			response.write(list.toString());
			response.end();																	
		})				
		return
	}

			//-------------------------------------------------RETRIEVE LIST OF COUNTRIES------------------------	
				
	if(FieldQuery.Event=="GetDataTitle")
	{				
		Tester = FieldQuery.Tester;
		Country = FieldQuery.Country;

		collection.distinct('DataTitle',{'DataType':'ResultClass', 'Country':Country,'name':Tester},function(err, list)
		{						
			response.writeHead(200, {"Content-Type": "text/plain"});								
			response.write(list.toString());
			response.end();																	
		})				
		return
	}
				
	if(FieldQuery.Event=="GetRawData")
	{				
		Tester = FieldQuery.Tester;
		Country = FieldQuery.Country;				
		DataTitle = FieldQuery.DataTitle;

		collection.findOne({'DataType':'ResultClass', 'Country':Country,'name':Tester, 'DataTitle':DataTitle},function(err, doc)
		{						
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.write(JSON.stringify(doc.Data));
			response.end();							
										
		})				
		return
				
	}	
	
	function ProcessData(DataPack, increment)
	{						
		var Voltage = new Array();
		var Current = new Array();
		var Watts = new Array();
		var WattHr = new Array();
					
		for(i=0;i<DataPack.length;i+=increment)
		{
			var value = DataPack[i].split("\t");
			if(!isNaN(parseFloat(value[0][0])))
			{
				Current.push(parseFloat(value[2]));
				Voltage.push(parseFloat(value[3]));				
				Watts.push(parseFloat(value[4]));
				WattHr.push(parseFloat(value[5]));
			}			
		}		
		return [Current, Voltage, Watts, WattHr];		
	}
				
}

exports.DataPortal = DataPortal;
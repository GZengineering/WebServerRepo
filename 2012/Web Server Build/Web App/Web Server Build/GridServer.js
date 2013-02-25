


function GridServer(collection, fs, URL, formidable, request, response)
{
	var	path = URL.parse(request.url).pathname;
	var	FieldQuery = URL.parse(request.url,true).query;	
	
/*
	if(FieldQuery.Event=='LoadAdministrator')
	{
		fs.readFile('./GridAdministator.html', function (err, html) 
		{
			response.writeHead(200, {"Content-Type": "text/html"});			  
			response.write(html);
			response.end();
			console.log('loading the Grid Administrator App');
		})
		return;	
	}
	
	if(FieldQuery.Event=='LoadGuestGrid')
	{
		fs.readFile('./Grid.html', function (err, html) 
		{
			response.writeHead(200, {"Content-Type": "text/html"});			  
			response.write(html);
			response.end();
			console.log('loading Grid App');
		})
		return;	
	}		
*/	
		if(FieldQuery.Event=='LoadUnitForm')
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

		if(FieldQuery.Event=='LoadPanelCharge')
		{			
			fs.readFile('./UnitForm_PanelCharge.html', function (err, html) 
			{
				response.writeHead(200, {"Content-Type": "text/html"});			  
				response.write(html);
				response.end();
				console.log('loading Panel Charge App');
			})

			return;
		}
		
		if(FieldQuery.Event=='LoadAccessoryCharge')
		{			
			fs.readFile('./UnitForm_AccessoryCharge.html', function (err, html) 
			{
				response.writeHead(200, {"Content-Type": "text/html"});			  
				response.write(html);
				response.end();
				console.log('loading Accessory Charge App');
			})

			return;
		}

		if(FieldQuery.Event=='LoadSpecLibrary')
		{			
			fs.readFile('./SpecLibrary.html', function (err, html) 
			{
				response.writeHead(200, {"Content-Type": "text/html"});			  
				response.write(html);
				response.end();
				console.log('loading Spec Library App');
			})

			return;
		}			
		
		if(FieldQuery.Event == 'FormSubmit')
		{	

			var UnitForm;
			var RawForm = '';
			
			request.on('data',function(chunk)
			{				
				RawForm += chunk;
			})
			
			request.on('end', function()
			{			
				UnitForm = JSON.parse(RawForm);
					
				collection.remove({DataType:'Technical Specs', 'UnitID':UnitForm.UnitID}, function(err, result)						
				{

					if(UnitForm.UnitType == 'Pack')
					{
						var BatterySpecs = UnitForm['Battery Specifications'][0];								
								UnitForm['Battery Specifications'][0]['Charge Capacity (Whr)'] = (BatterySpecs['Nominal Cell Voltage (V)']*BatterySpecs['Cells in Series'])*(BatterySpecs['Cell Capacity (Ahr)']*BatterySpecs['Series Sets in Parallel']);										
					}
						
					collection.insert(UnitForm, function(err, result)
					{
						response.writeHead(200, {"Content-Type": "text/plain"});					
						response.write('Unit is in DataBase');
						response.end();						
							
					})
						
				})				
			})							
			return;					  
				
		
		}
		
		if(FieldQuery.Event == 'GetSpecs')
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
						return;
					})								
				})
			})
			
		}

		if(FieldQuery.Event == 'CheckEntry')
		{
			collection.find({DataType:'Technical Specs', UnitID:FieldQuery.UnitID}).toArray(function(err, Item)
			{
				response.writeHead(200, {"Content-Type": "text/plain"});					
				response.write(JSON.stringify(Item));
				response.end();					
					
			})
		return;
				
		}
		
		if(FieldQuery.Event == 'DeleteUnit')
		{
			collection.remove({DataType:'Technical Specs', UnitID:FieldQuery.UnitID}, function(err, result)
			{
				response.writeHead(200, {"Content-Type": "text/plain"});

				if(err==undefined)					
				response.write('Unit Has Been Removed');								
				else								
				response.write('ERROR: Unit Was not Removed');
				
				response.end();	
			})
		return;
				
		}
	
	if(FieldQuery.Event=='GetStore')
	{					
		collection.find({'DataType':'DeviceClass'}).toArray(function(err,dox) 
		{							
			response.writeHead(200, {"Content-Type": "application/json"});					
			response.write(JSON.stringify(dox));
			response.end();														
		});
		return;						  						  
	}					
					
	if(FieldQuery.Event=='SyncStore')
	{
		request.on('data',function(chunk)
		{						
			var StoreData = JSON.parse(chunk.toString());
			
			collection.remove(function(err, result)
			{
				collection.insert(StoreData,function(err, message)
				{												
					response.writeHead(200, {"Content-Type": "text/plain"});					
					response.write('data has been synced');
					response.end();													
				})

			}) 
		})							
		return;					  
						  
	}
	
	return;
		
}

exports.GridServer = GridServer;
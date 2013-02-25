


function Inventory(collection, fs, URL, formidable, request, response)
{
	var path = URL.parse(request.url,true).pathname;
	var FieldQuery = URL.parse(request.url,true).query;

	var CheckIn=false;
	var CheckOut=false;
	var User = 'None';
	var Unit= null;
	var SerialNumber= null;
	var Version= null;
	var Display= false;
	var DisplayUsers = false;
	var ViewHistory=false;
	var Remove=false;
		
	var Item;
	var Time;
		
	var Cascade = false;
	var Upper = null;
	var Action = 'none';
	var ActionIndex = 0;		
		
	var Command;		
	var input;

	var Now = new Date();
	var Minutes;
	if(Now.getMinutes()>=10)
	Minuts = Now.getMinutes;
	else
	Minutes = '0'+Now.getMinutes;
	
	Time = (Now.getMonth()+1)+'/'+Now.getDate()+'/'+Now.getFullYear()+' '+Now.toLocaleTimeString();
				
	if(!FieldQuery.hasOwnProperty('Event'))
	{			
		fs.readFile('./InventoryAdminInterface.html', function (err, html) 
		{
			response.writeHead(200, {"Content-Type": "text/html"});			  
			response.write(html);
			response.end();
			console.log('loading Inventory App');
		})
		return;
	}
				
	if(FieldQuery.Event=='GetOptions')
	{
		collection.distinct('Unit',{'DataType':'UnitClass'},function(err, list) 
		{							
			response.writeHead(200, {"Content-Type": "text/plain"});					
			response.write(list.toString());
			response.end();													
		});				
		return;
				
	}				
				
	if(FieldQuery.Event=='GetVersions')
	{									
		collection.distinct('Version',{'DataType':'UnitClass', 'Unit':FieldQuery.Unit},function(err, list) 
		{							
			response.writeHead(200, {"Content-Type": "text/plain"});					
			response.write(list.toString());
			response.end();													
		});											
		return;				
	}
				
	if(FieldQuery.Event =="InventoryAction")
	{
		var Command = FieldQuery.Command.replace(' me',"").replace(' all',"").replace(' for','').replace(' on','').replace(' me','').replace(' by','to').replace(' of','').split(' ');
	
		var input = FieldQuery.Command.replace(' me','').replace(' all','').replace(' for','').replace(' on','').replace(' me','').replace(' by','to').replace(' of','').toLowerCase().split(' ');																															
											
		CheckIn=(input.indexOf('checkin')!=(-1))||(input.indexOf('log')!=(-1));
		CheckOut = (input.indexOf('checkout')!=(-1));
											
		Display = ((input.indexOf('show')!=(-1))||(input.indexOf('display')!=(-1))||(input.indexOf('status')!=(-1)))&&(input.indexOf('users')==(-1));
		DisplayUsers = ((input.indexOf('show')!=(-1))||(input.indexOf('display')!=(-1)))&&(input.indexOf('users')!=(-1))
											
		Remove = (input.indexOf('remove')!=(-1))||(input.indexOf('delete')!=(-1));
		ViewHistory = (input.indexOf('history')!=(-1));

		if(CheckIn)
		{
			Action = 'CheckIn';
			ActionIndex = input.indexOf('checkin');
												
			if(input.indexOf('log')!=(-1))
			ActionIndex = input.indexOf('log');												
		}
											
		if(CheckOut)
		{
			Action = 'CheckOut';
			ActionIndex = input.indexOf('checkout');
												
			User=Command[input.indexOf('to')+1]
												
			if(Command[input.indexOf('to')+2]!=undefined)
			User = User + ' ' + Command[input.indexOf('to')+2];																							
		}
											
		if(Display)
		{
			Action = 'Display';
			ActionIndex = input.indexOf('display');
												
			if(input.indexOf('show')!=(-1))
			ActionIndex = input.indexOf('show');											

			if(input.indexOf('status')!=(-1))
			ActionIndex = input.indexOf('status');	
		}
											
		if(Remove)
		{
			Action = 'Remove';
			ActionIndex = input.indexOf('remove');
												
			if(input.indexOf('delete')!=(-1))
			ActionIndex = input.indexOf('delete');
		}
											
		if(ViewHistory)
		{
			Action = 'History';
			ActionIndex = input.indexOf('history');
	
		}
											
		if(DisplayUsers)
		{
			Action = 'Display Users';
			ActionIndex = input.indexOf('users');										
											
		}
											
		Item = Command[ActionIndex+1].split('-');
											
		Cascade = (Item.length==4);
											
		Unit = Item[0];
		Version = Item[1];
		SerialNumber= Item[2];
											
		if(Cascade)
		Upper = parseInt(Item[3]);					
				
		if(Action=='CheckIn')
		{						
			if(Cascade)
			InsertCascade(collection,Unit,Version,SerialNumber,'None', 'IN',Upper,response)
			else
			InsertItem(collection,Unit,Version,SerialNumber,'None','IN',response)						
		}
					
		if(Action=='CheckOut')
		{					
			if(Cascade)
			CheckOutCascade(collection,Unit,Version,SerialNumber,User,'OUT',Upper,response);
			else
			CheckOutUnit(collection,Unit,Version,SerialNumber,User,'OUT',response)					
		}


		if(Action=='Display')
		{					
			ShowAll(collection, false, Unit, Version, SerialNumber,User,'IN', Upper, response)										
		}
					
		if(Action =='Display Users')
		{					
			ShowAll(collection, true, Unit, Version, SerialNumber, User, 'OUT', Upper, response);					
		}
					
		if(Action=='Remove')
		{
			if(Cascade)
			RemoveCascade(collection,Unit,Version,SerialNumber,Upper,response)
			else
			RemoveUnit(collection,Unit,Version,SerialNumber,response)				
		}

		if(Action=='History')
		{
			UnitHistory(collection,Unit,Version,SerialNumber,response)				
			return;
		}					

		return;
	}



	function InsertItem(collection, CurUnit, CurVersion, CurSerialNumber, UnitUser, Stat, res)
	{	
		var duplicate = true;
		var exists = false;
			
		collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber),'Status':'OUT'}).toArray(function(err,dox)
		{									
			exists=dox.length;
			
			if(exists)
			{																											
			collection.update({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber)},{$set:{'Status':'IN','User':'None'}, $push:{'History':Time + ' - Checked In'}});				
			res.writeHead(200, {"Content-Type": "text/plain"});			  
			res.write(CurUnit+'   ' + CurVersion+'-'+CurSerialNumber + ' has been checked back into Inventory.');
			res.end();	
			}
			else
			{
				collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber),'Status':Stat}).toArray(function(err,dox)
				{									
					duplicate=dox.length;
						
					if(!duplicate)
					{
						collection.insert({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber), 'Status':Stat, 'User':UnitUser, 'History':[Time + ' - Checked In']});				
						res.writeHead(200, {"Content-Type": "text/plain"});			  
						res.write(CurUnit+'   ' + CurVersion+'-'+CurSerialNumber + ' is now in inventory.');
						res.end();	
					}
					else
					{
						res.writeHead(200, {"Content-Type": "text/plain"});			  
						res.write('Error: '+CurUnit +'   ' + CurVersion+'-'+CurSerialNumber + ' is already checked into inventory.');
						res.end();	
					}
				});
			}
		});		
	}
	
	function InsertCascade(collection,CurUnit,CurVersion,CurSerialNumber,UnitUser,Stat,UpperLimit,res)
	{	
		var SN = parseInt(CurSerialNumber);
	
		var duplicate = true;
		var exists = false;
	
		collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber':{ $gte: SN, $lte: UpperLimit }, Status:'OUT'}).toArray(function(err,dox)
		{
			exists =(dox.length==UpperLimit-SN+1);

			if(exists)
			{																											//{$set:{'User':UnitUser,'Status':Stat}}
				collection.update({'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber':{ $gte: SN, $lte: UpperLimit}},{$set:{'Status':Stat,'User':'None'}, $push:{'History':Time + ' - Checked In'}},{multi:true});				
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write(CurUnit+'   ' + CurVersion+'-'+CurSerialNumber + ' to '+CurUnit+'   ' + CurVersion+'-'+UpperLimit + ' has been checked back into Inventory.');
				res.end();	
			}
			else
			{
				collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber':{ $gte: SN, $lte: UpperLimit }, Status:Stat}).toArray(function(err,dox)
				{													
					duplicate=dox.length;
					
					if(!duplicate)
					{													
						var DocArray = new Array(UpperLimit-SN)
																
						for(i=0;i<UpperLimit-SN+1;i++)
						DocArray[i]={'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': SN+i, 'Status':Stat, 'User':UnitUser, 'History':[Time + ' - Checked In'] }

						collection.insert(DocArray);				
						res.writeHead(200, {"Content-Type": "text/plain"});			  
						res.write(CurUnit+'   ' + CurVersion+'-'+CurSerialNumber + ' to ' + CurUnit+'   ' + CurVersion+'-'+UpperLimit +' is now in inventory.');
						res.end();	
					}
					else
					{
						res.writeHead(200, {"Content-Type": "text/plain"});			  
						res.write('A Unit within in the specified range has already been checked into Inventory.');
						res.end();	
					}
				})
													
			}													
		});		
	}
	
	function RemoveUnit(collection,CurUnit,CurVersion,CurSerialNumber,res)
	{							
		collection.findAndRemove({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber)},function(err,result)
		{																				
			if(result!=null)
			{
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write(CurUnit + '-' + CurVersion + '-' + CurSerialNumber + ' has Been Removed');
				res.end();	
			}
			else
			{
				console.log('unit not found');
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write('This Unit is no longer in the collection');
				res.end();													
			}
		})
	}
	
	
	function RemoveCascade(collection,CurUnit,CurVersion,CurSerialNumber,UpperLimit,res)
	{	
		var SN = parseInt(CurSerialNumber);

		collection.remove({'DataType':'UnitClass', 'Unit':CurUnit, 'Version':CurVersion, 'SerialNumber':{ $gte: SN, $lte: UpperLimit }},function(err,result)
		{																				
			res.writeHead(200, {"Content-Type": "text/plain"});			  
			res.write(CurUnit + '-' + CurVersion + '-' + CurSerialNumber + ' to ' +CurUnit + '-' + CurVersion + '-' + UpperLimit+' have been Removed');
			res.end();	
		})
	}	

	function CheckOutUnit(collection,CurUnit,CurVersion,CurSerialNumber,UnitUser,Stat,res)
	{	
		var exists = false;
		
		collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber), 'Status':'IN'}).toArray(function(err,dox)
		{									
			exists=(dox.length==1)
												
			if(exists)
			{
				collection.update({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber)}, {$set:{'User':UnitUser,'Status':Stat}, $push:{'History':Time + ' - Checked Out By ' + UnitUser}});											
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write(CurUnit+'   ' + CurVersion+'-'+CurSerialNumber + ' is Checked Out to ' + UnitUser +'.');
				res.end();	
			}
			else
			{
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write(CurUnit +'   ' + CurVersion+'-'+CurSerialNumber + ' is either Not Availabe or more than one of these items exists.');
				res.end();	
			}
		});
	}
		
	function CheckOutCascade(collection,CurUnit,CurVersion,CurSerialNumber,UnitUser,Stat,UpperLimit,res)
	{		
		var SN = parseInt(CurSerialNumber);
		var exists = false;
		collection.find({'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber':{ $gte: SN, $lte: UpperLimit }, 'Status':'IN'}).toArray(function(err,dox)
		{									
			exists=(dox.length==(UpperLimit-SN+1));
												
			if(exists)
			{
				collection.update({'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber':{ $gte: SN, $lte: UpperLimit }},{$set:{'User':UnitUser,'Status':Stat}, $push:{'History':Time + ' - Checked Out By ' + UnitUser}},{multi:true});				
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write(CurUnit+'   ' + CurVersion+'-'+CurSerialNumber + ' to ' + CurUnit+'   ' + CurVersion+'-'+UpperLimit +' are Checked Out to '+ UnitUser +'.');
				res.end();	
			}
			else
			{
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write('A Unit within the specified range is either unavailabe or is a duplicate.');
				res.end();	
			}
		});
	}		

	function ShowAll(collection, ShowUsers, CurUnit, CurVersion, CurSerialNumber, UnitUser, Stat, UpperLimit,  res)
	{	
		var Out = 0;
		var In = 0;
		var Query = {'DataType':'UnitClass', 'Unit':CurUnit};
		var	SortQuery = {'User':'1','SerialNumber':'1'};		
		
		if(ShowUsers)
		Query.Status = Stat;
		
		if(CurVersion==undefined&&CurSerialNumber==undefined)
		{
			SortQuery.Version = '1';
			SortQuery.SerialNumber = '1';
		}
		
		if(CurVersion!=undefined&&CurSerialNumber==undefined)
		{
			Query.Version = CurVersion;
		}
		
		if(CurSerialNumber==undefined)
		{
			collection.find(Query).sort(SortQuery).toArray(function(err,dox)
			{										
				res.writeHead(202, {"Content-Type": "text/plain"});
											
				if(!ShowUsers)
				{
					for(i=0;i<dox.length;i++)
					{
						if(dox[i].Status.toString() == 'OUT')
						Out++;
						else
						In++;
					}
											
					res.write('\t'+CurUnit + '\'s \n\n Group Status:\nTotal - ' + dox.length + '\nIn - ' + In + '\n Out- ' + Out + '\n\n');
											
					for(i=0;i<dox.length;i++)
					res.write('{Unit: '+dox[i].Unit+ '}\t{Version: ' + dox[i].Version+ '}\t{Serial Number: ' + dox[i].SerialNumber+ '}\t{Status: ' + dox[i].Status+ '}\t{User: ' + dox[i].User+ '}\n');
				}
				else
				{
					res.write('\t'+CurUnit + '\'s \n\n Users Status:\nTotal Users - ' + dox.length+'\n\n');
											
					for(i=0;i<dox.length;i++)
					res.write('{User: ' + dox[i].User+ '}\t{Date of Last Transaction: ' + dox[i].History[dox[i].History.length-1]+ '}\t\t{Unit: '+dox[i].Unit+ '}\t{Version: ' + dox[i].Version+ '}\t{Serial Number: ' + dox[i].SerialNumber+ '}\n');																				
				}
											
				res.end();
			});
		}
		else
		{
			if(UpperLimit!=null)
			collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': { $gte: parseInt(CurSerialNumber), $lte: parseInt(UpperLimit) }}).toArray(function(err,dox)
			{
				if(dox.length==0)
				{
					res.writeHead(200, {"Content-Type": "text/plain"});			  
					res.write('Error: These Units do not Exist.');
					res.end();																					
				}
				else
				{
					res.writeHead(201, {"Content-Type": "text/plain"});			  
					res.write('These Units Exist');
					res.end();	
				}
											
			});
			else
			collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber)}).toArray(function(err,dox)
			{
				if(dox.length==0)
				{
					res.writeHead(200, {"Content-Type": "text/plain"});			  
					res.write('Error: This Unit does not Exist.');
					res.end();																					
				}
				else
				{
					res.writeHead(201, {"Content-Type": "text/plain"});			  
					res.write('<br>Unit: '+dox[0].Unit+'<p>Version: '+dox[0].Version + '<p>Serial Number: ' +dox[0].SerialNumber + '<p>Status: ' +dox[0].Status +'<p>User: ' +dox[0].User);
					res.end();	
				}										
			});
		}
	}
	

	function UnitHistory(collection, CurUnit, CurVersion, CurSerialNumber, res)
	{	
		var HistoryLog='History: \n\n';
	
		collection.find({'DataType':'UnitClass', 'Unit': CurUnit, 'Version': CurVersion, 'SerialNumber': parseInt(CurSerialNumber)}).toArray(function(err,dox)
		{
			if(dox.length==0)
			{
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write('Error: This Unit does not Exist.');
				res.end();																					
			}
			else
			{											
				for(i=0; i<dox[0].History.length;i++)
				HistoryLog = HistoryLog + dox[0].History[i] +'\n';
												
				res.writeHead(202, {"Content-Type": "text/plain"});			  
				res.write('Unit: '+dox[0].Unit+'\tVersion: '+dox[0].Version + '\tSerial Number: ' +dox[0].SerialNumber +'\n\n'+ HistoryLog);
				res.end();	
			}										
		});
	}
	
}

exports.Inventory = Inventory;
function TaskServer(db, collection, mongo, fs, URL, formidable, request, response)
{

	var ObjectID = mongo.ObjectID; 	
	var GridStore = mongo.GridStore;
			
	var path = URL.parse(request.url).pathname;
	var FieldQuery = URL.parse(request.url,true).query;
	
	var Now = new Date();
	var Time = (Now.getMonth()+1)+'/'+Now.getDate()+'/'+Now.getFullYear();

	if(!FieldQuery.hasOwnProperty('Event'))
	{			
		fs.readFile('./Tasks.html', function (err, html) 
		{
			response.writeHead(200, {"Content-Type": "text/html"});			  
			response.write(html);
			response.end();
			console.log('loading TaskList App');
		})

		return;
	}	

	if(FieldQuery.Event=='GetStore')
	{								
		RetrieveStore(collection,FieldQuery.StoreName,FieldQuery.input,response);
		return;
	}	

	if(FieldQuery.Event=='AddNewTask')
	{
		var Tags = new Array();
		Tags = FieldQuery.Tags.split(',').sort();
			
		var Members = new Array();
		Members = FieldQuery.Members.split(',').sort();
			
		AddTask(collection, FieldQuery.TaskTitle, Members, Tags, FieldQuery.Notes, response)

		return;
	}
			
	if(FieldQuery.Event=='GetTaskList')
	{
			
		var Tags = new Array();
		Tags = FieldQuery.Tags.split(',').sort();
					
		var Members = new Array();
		Members = FieldQuery.Members.split(',').sort();

		GetTaskList(collection, Members, Tags, FieldQuery.Completed, FieldQuery.Unfinished, response)								
		return;
	}
				
	if(FieldQuery.Event=='GetTask')
	{
		GetTask(collection, FieldQuery.TaskTitle, response)								
		return;
	}			

	if(FieldQuery.Event=='UpdateTask')
	{
				
		var form = new formidable.IncomingForm();
		form.parse(request, function(err, fields, files) 
		{

			fs.readFile(files.UploadedPhoto.path,function(err,dataBuffer)
			{
				UpdateTask(collection, FieldQuery.TaskTitle, fields.UpdateNotes, dataBuffer, files.UploadedPhoto.size, response);
			})
		})
					
		return;
	}	

	if(FieldQuery.Event=='CompleteTask')
	{					
		ToggleTaskStatus(collection, FieldQuery.TaskTitle, response)								
		return;
	}

	if(FieldQuery.Event=='PrintList')
	{
					
		var Tags = new Array();
		Tags = FieldQuery.Tags.split(',').sort();

		var Members = new Array();
		Members = FieldQuery.Members.split(',').sort();					
				
		PrintTaskList(collection, Members, Tags, FieldQuery.Completed, FieldQuery.Unfinished,
		FieldQuery.SortField, FieldQuery.DisplayMember, FieldQuery.DisplayTags, FieldQuery.DisplayStatus, 
		FieldQuery.DisplayNotes, FieldQuery.DisplayLastUpdate, FieldQuery.DisplayCreationDate, response)					
				
		return;
	}
				
	if(FieldQuery.Event =='RetrieveImage')
	{
		GetImage(db,FieldQuery.FileID,response);
		return;				
	}
				
	response.writeHead(200, {"Content-Type": "text/plain"});			  
    response.write('An Error occured while processing your command. Please try again.');
	response.end();				
				

function RetrieveStore(collection,FieldName,InitialInput,res)
	{
		collection.distinct(FieldName,{'DataType':'ProjectClass'},function(err,data)
		{											
			res.writeHead(200, {"Content-Type": "text/plain"});	
									
			for(i=0;i<data.length;i++)
			res.write(data[i].trimLeft()+'<DATASPLIT>');
									
			if(data.indexOf(' ' + InitialInput)==-1)
			res.write(InitialInput.trimLeft() + '<DATASPLIT>');
									
			res.end();									
									
		})
	}


function AddTask(collection, TaskTitle, TaskMembers, TaskTags, TaskNotes, res)
	{
		collection.find({'DataType':'ProjectClass', 'Title':TaskTitle}).toArray(function(err,dox)
		{

			if(dox.length==0)
			{
				collection.insert({'DataType':'ProjectClass', 'Title':TaskTitle, 'Status':'Unfinished', 'Task Members':TaskMembers, 'Date Created':Time, 'Progress':[Time+': Task Created.'],
				'Date Last Modified':Time, 'Last Update': Time+': Task Created.', 'Task Tags':TaskTags, 'Notes':TaskNotes},
				function(err,result)
				{										
					res.writeHead(200, {"Content-Type": "text/plain"});			  
					res.write('Task has been added');
					res.end();	
					db.close();											
										
				})
			}
			else
			{
				res.writeHead(200, {"Content-Type": "text/plain"});			  
				res.write('Task Already Exists');
				res.end();		
			}
								
		})
	}
	
function GetTaskList(collection, TaskMembers, TaskTags, Completed, Unfinished, res)
	{
		var Query = {'DataType':'ProjectClass'};
		
		if(TaskMembers[0]!=undefined && TaskMembers[0]!=' All' && TaskMembers[0]!='')
		Query['Task Members']={$in:TaskMembers};
		
		if(TaskTags[0]!=undefined && TaskTags[0]!=' None Specific' && TaskTags[0]!='')
		Query['Task Tags'] = {$in:TaskTags};
		
		if(Completed!=Unfinished)
		{
			if(Completed=='true')
			Query['Status'] = 'Complete';
			else
			Query['Status'] = 'Unfinished';
		
		}
		
		collection.find(Query,{'Title':1}).sort({'Date Created':1}).toArray(function(err,dox)
		{
			res.writeHead(200, {"Content-Type": "text/plain"});
			if(dox!=undefined)
			{
				for(i=0;i<dox.length;i++)
				res.write(dox[i].Title+'<ENDDATA>');
				res.end();
			}
			else
			{
				res.write('ERROR:Cannot Load Task List');
				res.end();										
			}								
										
		})
	}


function PrintTaskList(collection, TaskMembers, TaskTags, Completed, Unfinished, SortField, DisplayMember, DisplayTags, DisplayStatus, DisplayNotes, DisplayLastUpdate, DisplayCreationDate, res)
	{
		var Query = {'DataType':'ProjectClass'};
		
		var DisplayFields = new Array();
		
		if(DisplayMember=='true')
		DisplayFields.push('Task Members');
		
		if(DisplayNotes=='true');
		DisplayFields.push('Notes');
		
		if(DisplayCreationDate=='true')
		DisplayFields.push('Date Created');
		
		if(DisplayTags=='true')
		DisplayFields.push('Task Tags');
		
		if(DisplayLastUpdate =='true')
		DisplayFields.push('Last Update');
		
		if(DisplayStatus=='true')
		DisplayFields.push('Status');
		
		
		if(TaskMembers[0]!=undefined && TaskMembers[0]!=' All' && TaskMembers[0]!='')
		Query['Task Members']={$in:TaskMembers};
		
		if(TaskTags[0]!=undefined&&TaskTags[0]!=' None Specific'&&TaskTags[0]!='')
		Query['Task Tags'] = {$in:TaskTags};
		
		if(Completed!=Unfinished)
		{
			if(Completed=='true')
			Query['Status'] = 'Complete';
			else
			Query['Status'] = 'Unfinished';
		
		}

		collection.find(Query).sort(SortField).toArray(function(err,dox)
		{

			res.writeHead(200, {"Content-Type": "text/plain"});
			if(dox!=undefined)
			{

				if(DisplayMember=='true')
				{
										
					for(i=0;i<dox.length;i++)
					{	
						res.write(dox[i].Title +' ('+dox[i]['Task Members'].toString()+') ');
													
						for(j=1;j<DisplayFields.length;j++)
						res.write('\n\t'+DisplayFields[j]+': ' +dox[i][DisplayFields[j]]);
						res.write('\n\n');
													
					}
					res.end();
											
				}
				else
				{
					for(i=0;i<dox.length;i++)
					{	
						res.write(dox[i].Title);
													
						for(j=0;j<DisplayFields.length;j++)
						res.write('\n\t'+DisplayFields[j]+': ' +dox[i][DisplayFields[j]]);
						res.write('\n\n');
					}
					res.end();
				}
											
			}
			else
			{
				res.write('ERROR:Cannot Load Task List');
				res.end();
			}																	
										
		})
	}	
	
function GetTask(collection, TaskTitle, res)
	{
		collection.find({'DataType':'ProjectClass', 'Title':TaskTitle}).toArray(function(err,dox)
		{
			if(dox!=undefined&&dox.length==1)
			{
				var ProgressLog=dox[0].Progress[0];
													
				for(i=1; i<dox[0].Progress.length;i++)
				ProgressLog=ProgressLog+dox[0].Progress[i];
										
				res.writeHead(200, {"Content-Type": "text/plain"});		
				res.write(dox[0].Title +'<p>' + 'Notes:<br>'+dox[0].Notes+ '<p>Members:' + dox[0]['Task Members'] +'<p>History:<br>'+ProgressLog+ '<p>Tags: '+dox[0]['Task Tags']+'<p>Status: '+dox[0].Status)
				res.end();								
			}
			else
			{
				res.writeHead(200, {"Content-Type": "text/plain"});		
				res.write('ERROR LOADING TASKLIST')
				res.end();									
			}
										
		})

	}

function UpdateTask(collection, TaskTitle, TaskUpdate, FileBuffer, LoadFile, res)
	{	
		var fsID;	
		
		collection.find({'DataType':'ProjectClass', 'Title':TaskTitle}).toArray(function(err,dox)
		{
																			
			if(dox!=undefined&&dox.length==1)
			{

				if(LoadFile)
				{
					fsID = new ObjectID().toString();
					TaskUpdate = TaskUpdate +' ' + '<a target=\'_blank\' href=\'/EETasks?Event=RetrieveImage&FileID='+fsID+'\'>View Attachment</a>'
				}
										
				collection.update({'Title':TaskTitle},{$push:{'Progress':'<br>'+Time+': '+TaskUpdate},$set:{'Last Update':Time +': ' +TaskUpdate, 'Date Last Modified':Time}},function(err,result)
				{
					if(LoadFile)
					{								
						var gs = new GridStore(db, fsID, "w");

						gs.open(function(err, gs) 
						{
							gs.write(FileBuffer, function(err, gs) 
							{
								gs.close(function(err, gs) 
								{

									collection.find({'DataType':'ProjectClass', 'Title':TaskTitle}).toArray(function(err,dox2)
									{																					
										var ProgressLog=dox2[0].Progress[0];

										for(i=1; i<dox2[0].Progress.length;i++)
										ProgressLog=ProgressLog+dox2[0].Progress[i];

										res.writeHead(200, {"Content-Type": "text/html"});		
										res.write(dox2[0].Title +'<p>' + 'Notes:<br>'+dox2[0].Notes+ '<p>Members:' + dox2[0]['Task Members'].toString() +'<p>History:<br>'+ProgressLog+ '<p>Tags: '+dox[0]['Task Tags']+'<p>Status: '+dox2[0].Status);
										res.end();
				
									})
								});
							});
						});
					}
					else // There is No Attachment Image
					{ 
						collection.find({'DataType':'ProjectClass', 'Title':TaskTitle}).toArray(function(err,dox2)
						{																
							var ProgressLog=dox2[0].Progress[0];

							for(i=1; i<dox2[0].Progress.length;i++)
							ProgressLog=ProgressLog+dox2[0].Progress[i];

							res.writeHead(200, {"Content-Type": "text/html"});		
							res.write(dox2[0].Title +'<p>' + 'Notes:<br>'+dox2[0].Notes+ '<p>Members:' + dox2[0]['Task Members'].toString() +'<p>History:<br>'+ProgressLog+ '<p>Tags: '+dox[0]['Task Tags']+'<p>Status: '+dox2[0].Status);
							res.end();

						})
					}
				})								
			}
			else
			{
				res.writeHead(200, {"Content-Type": "text/plain"});		
				res.write('ERROR UPDATING TASK')
				res.end();									
			}
		})
	}
	
function ToggleTaskStatus(collection, TaskTitle, res)
	{	
		var StatusUpdate;

		collection.find({'DataType':'ProjectClass', 'Title':TaskTitle}).toArray(function(err,dox)
		{
			if(dox!=undefined&&dox.length==1)
			{
										
				if(dox[0].Status=='Complete')
				StatusUpdate='Unfinished';
				else
				StatusUpdate='Complete';
										
				collection.update({'DataType':'ProjectClass', 'Title':TaskTitle},{$set:{'Status':StatusUpdate}},function(err,result)
				{
					collection.find({'Title':TaskTitle}).toArray(function(err,dox2)
					{
						var ProgressLog=dox2[0].Progress[0];

						for(i=1; i<dox2[0].Progress.length;i++)
						ProgressLog=ProgressLog+dox2[0].Progress[i];
													
						res.writeHead(200, {"Content-Type": "text/plain"});		
						res.write(dox2[0].Title +'<p>' + 'Notes:<br>'+dox2[0].Notes+ '<p>Members: ' + dox2[0]['Task Members'] +'<p>History:<br>'+ProgressLog+ '<p>Tags: '+dox[0]['Task Tags']+'<p>Status: '+dox2[0].Status);
						res.end();

					})
				})								
			}
			else
			{
				res.writeHead(200, {"Content-Type": "text/plain"});		
				res.write('ERROR UPDATING TASK');
				res.end();									
			}
										
		})
	}
	
function GetImage(db, fsID, res)
	{	
		var gs = new GridStore(db, fsID, "r");

		gs.open(function(err, gs) 
		{	
			 gs.seek(0, function() 
			{
				gs.read(function(err, data) 
				{
					res.writeHead(200, {"Content-Type": "text/plain"});
					res.write(data);
					res.end();
				});
			});
		});
	}
}

exports.TaskServer = TaskServer;
//backup.js
var fs = require('fs');
var child_process = require('child_process');
var spawn = child_process.spawn;

function clock(force)
{
	//store current date in JSON
	var d = new Date();
	var date = {};
	date.year = d.getFullYear();
	date.month = d.getMonth()+1;
	date.day = d.getDate();
	date.hour = d.getHours();
	date.min = d.getMinutes();
	date.timeString = d.toLocaleString();

	if(date.month < 10)
		date.month = '0' + date.month;
	if(date.day < 10)
		date.day = '0' + date.day;
	if(date.hour < 10)
		date.hour = '0' + date.hour;
	if(date.min < 10)
		date.min = '0' + date.min;

	if(date.hour % 4 == 0 || date.hour == 0 || force)
	{
		dump(date);
	}
	else if (date.hour == 5) 
	{
		remove_old_backup(date);
	}
	else
	{
		var dumpdate;
		if (date.hour % 4 == 3)
		{
			dumpdate = new Date(d.getTime()+1*60*60*1000);
		}
		else if (date.hour % 4 == 2)
		{
			dumpdate = new Date(d.getTime()+2*60*60*1000);
		}
		else if (date.hour % 4 == 1)
		{
			dumpdate = new Date(d.getTime()+3*60*60*1000);
		}
		console.log('Next Data Dump: ' + dumpdate.toLocaleString());
	}
}

//Configure the dump date and dump the data
//when done move the files from the dump to the root dump folder
function dump (date)
{
  var _Date = new Date();

  var filename = 'DataBase_'+date.year+date.month+date.day+'_'+date.hour+date.min;
  console.log("filename: " + filename);
  

  var args = ['--db', 'GZ', '--collection', 'DataBase', '--out', './dump/'+filename]
      , mongodump = spawn('C:/mongodb/bin/mongodump.exe', args);

      //log any errors
    mongodump.stderr.on('data', function (data) {
      console.log('stderr: ' + data);
    });

    //move the files to the root of the dump folder and timestamp them
    var timer = setTimeout(function(){check_move(filename)}, 3000);
    // check_move(filename);
   
	console.log('Backup dumped -- ' + filename);
	console.log('next dump: ' + new Date(_Date.getTime()+3*60*60*1000).toLocaleString())
}

//Check that the move.bat file exists in 'C:\'
function check_move(file)
{
	//If no file was passed, bail
	if(!file)
	{
		return;
	}

	//Search 'C:/' for the 'rmfile.bat' file
	fs.readdir('./', function(err, files)
	{
		//if files were found, loop through them
		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				//save the filename as a string
				var filename = ''+files[i];
				//if the filename contains 'rmfile.bat', we have found the bat file
				if(filename.indexOf('move.bat') !== -1)
				{
					move(file);
				}
			}
		}
	})
}

//using move.bat, move the files from the auto generated
//mongodump folders to the root dump folder
function move(file)
{
	console.log("\nMoving backup files to root dump folder\n");
	console.log(file);
	//if the bat file was found spawn it and send the filename
	if(file)
	{
		var _move = spawn('move.bat', [file]);

		_move.stderr.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    _move.stdout.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    //once the files are moved, remove the folders created by mongodump
    	var timer = setTimeout(function(){check_rmdir(file)}, 3000);

	    // check_rmdir('C:\\dump\\'+file);   
	}
	else //if the bat file wasn't found, log a warning
	{
		console.log("\nWARNING: 'move.bat' file missing from project root");
		console.log("Old backups will not be removed with the 'move.bat' file in the project root\n");
	}
	return;
}

//figure out the date for which backups to remove
//and call the execution for removal
function remove_old_backup(date)
{
  	var filename = 'DataBase_'+date.year+date.month+date.day+'_'+date.hour;

 	var _Date = new Date();

 	_Date.setMonth(_Date.getMonth()-2);

	var remove_date_filename = 'DataBase_'+date.year+_Date.getMonth()+date.day;

	check_rmfile(remove_date_filename);
}

//check the rmfile.bat file exists
function check_rmfile(file)
{
	//If no file was passed, bail
	if(!file)
	{
		return;
	}

	//Search 'C:/' for the 'rmfile.bat' file
	fs.readdir('./', function(err, files)
	{
		//if files were found, loop through them
		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				//save the filename as a string
				var filename = ''+files[i];
				//if the filename contains 'rmfile.bat', we have found the bat file
				if(filename.indexOf('rmfile.bat') !== -1)
				{
					rmfile(file);
					break;
				}
			}
		}
	})
}

//removes the specified file
function rmfile(file)
{
	console.log('\nAttempting to remove old backups...\n');
	//if the bat file was found spawn it and send the filename
	if(file)
	{
		var _rmfile = spawn('rmfile.bat', [file]);

		_rmfile.stderr.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    _rmfile.stdout.on('data', function (data)
	    {
	    	console.log(data);
	    });
	}
	else //if the bat file wasn't found, log a warning
	{
		console.log("\nWARNING: 'rmfile.bat' file missing from project root");
		console.log("Old backups will not be removed with the 'rmfile.bat' file in the project root\n");
	}
	return;
}

//check that the rmdir.bat file existss
function check_rmdir(filename)
{
	//If no file was passed, bail
	if(!filename)
	{
		return;
	}
	//Search 'C:/' for the 'rmfile.bat' file
	fs.readdir('./', function(err, files)
	{
		//if files were found, loop through them
		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				//save the filename as a string
				var fname = ''+files[i];
				//if the filename contains 'rmdir.bat', we have found the bat file
				if(fname.indexOf('rmdir.bat') !== -1)
				{
					rmdir(filename);
					break;
				}
			}
		}
	})

}

//removes the specified directory
function rmdir(filename)
{
	console.log("\nRemoving MongoDump directories...\n");

	console.log(filename);

	//if the bat file was found spawn it and send the filename
	if(filename)
	{
		var _rmdir = spawn('rmdir.bat', [filename]);

	    _rmdir.stderr.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    _rmdir.stdout.on('data', function (data)
	    {
	    	console.log(data);
	    });
	}
	else //if the bat file wasn't found, log a warning
	{
		console.log("\nWARNING: 'rmfile.bat' file missing from 'C:/'");
		console.log("Old backups will not be removed with the 'rmfile.bat' file in the 'C:/'\n");
	}
	return;
}

exports.clock = clock;
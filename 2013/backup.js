//backup.js
var fs = require('fs');
var child_process = require('child_process');
var spawn = child_process.spawn;

function clock()
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

	if(date.hour % 4 == 0 || date.hour == 0)
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

  var filename = 'DataBase_'+date.year+date.month+1+date.day+'_'+date.hour;
  

  var args = ['--db', 'GZ', '--collection', 'DataBase', '--out', 'C:/dump/'+filename]
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
	fs.readdir('C:/', function(err, files)
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
	//if the bat file was found spawn it and send the filename
	if(file)
	{
		var _move = spawn('C:/move.bat', [file]);

		_move.stderr.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    _move.stdout.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    //once the files are moved, remove the folders created by mongodump
    	var timer = setTimeout(function(){check_rmdir('C:\\dump\\'+file)}, 3000);

	    // check_rmdir('C:\\dump\\'+file);   
	}
	else //if the bat file wasn't found, log a warning
	{
		console.log("\nWARNING: 'move.bat' file missing from 'C:/'");
		console.log("Old backups will not be removed with the 'move.bat' file in the 'C:/'\n");
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
	fs.readdir('C:/', function(err, files)
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
		var _rmfile = spawn('C:/rmfile.bat', [file]);

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
		console.log("\nWARNING: 'rmfile.bat' file missing from 'C:/'");
		console.log("Old backups will not be removed with the 'rmfile.bat' file in the 'C:/'\n");
	}
	return;
}

//check that the rmdir.bat file existss
function check_rmdir(dir)
{
	//If no file was passed, bail
	if(!dir)
	{
		return;
	}
	//Search 'C:/' for the 'rmfile.bat' file
	fs.readdir('C:/', function(err, files)
	{
		//if files were found, loop through them
		if(files)
		{
			for(var i = 0; i < files.length; i++)
			{
				//save the filename as a string
				var filename = ''+files[i];
				//if the filename contains 'rmdir.bat', we have found the bat file
				if(filename.indexOf('rmdir.bat') !== -1)
				{
					rmdir(dir);
					break;
				}
			}
		}
	})

}

//removes the specified directory
function rmdir(dir)
{
	console.log("\nRemoving MongoDump directories...\n");

	//if the bat file was found spawn it and send the filename
	if(dir)
	{
		var _rmdir = spawn('C:/rmdir.bat', [dir]);

	    _rmdir.stderr.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    _rmdir.stdout.on('data', function (data)
	    {
	    	console.log(data);
	    });

	    console.log("\nBackup complete.\n");
	}
	else //if the bat file wasn't found, log a warning
	{
		console.log("\nWARNING: 'rmfile.bat' file missing from 'C:/'");
		console.log("Old backups will not be removed with the 'rmfile.bat' file in the 'C:/'\n");
	}
	return;
}

exports.clock = clock;
//backup.js
var fs = require('fs');
var ncp = require('ncp').ncp;
var chmodr = require('chmodr');
var rimraf = require('rimraf');
var child_process = require('child_process');
var spawn = child_process.spawn;
var glob = require('glob');

var r = /^([^\\]*[\\]).*\\.*/;
r.test(process.cwd());
var root = RegExp.$1;
var mongo_dir = root+'mongodb/'; //mac/linux/windows - crossplatform

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

	if(force)
	{
		dump(date);
	}
	else if(date.hour % 4 == 0 && date.min == 0)
	{
		dump(date);
	}
	else if (date.hour == 5 && date.min == 0) 
	{
		remove_old_backup(date);
	}
	else if (date.min % 10 == 0)
	{
		var dumpdate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0);
		if (date.hour % 4 == 3)
		{
			dumpdate = new Date(dumpdate.getTime()+1*60*60*1000);
		}
		else if (date.hour % 4 == 2)
		{
			dumpdate = new Date(dumpdate.getTime()+2*60*60*1000);
		}
		else if (date.hour % 4 == 1)
		{
			dumpdate = new Date(dumpdate.getTime()+3*60*60*1000);
		}
		console.log("Next dump: " + dumpdate.toLocaleString());
	}
}

//Configure the dump date and dump the data
//when done move the files from the dump to the root dump folder
function dump (date)
{
  var _Date = new Date();

  var filename = 'DataBase_'+date.year+date.month+date.day+'_'+date.hour+date.min;

  var mongodump_path = mongo_dir+'bin/mongodump';

  var args = ['--db', 'GZ', '--collection', 'DataBase', '--out', './dump/']
      , mongodump = spawn(mongodump_path, args);

      //log any errors
    mongodump.stderr.on('data', function (data) {
      console.log(data.toString());
    });

    //move the files to the root of the dump folder and timestamp them
    var timer = setTimeout(function(){move(filename)}, 3000);
   
	console.log('Backup dumped -- ' + filename);
	console.log('next dump: ' + new Date(_Date.getTime()+4*60*60*1000).toLocaleString())
}

//using ncp, move the files from the auto generated
//mongodump folders to the root dump folder
function move(file)
{
	console.log("\nMoving backup files to root dump folder\n");	

	//if the file was found spawn it and send the filename
	if(file)
	{
		var src_dir = './dump/GZ/';
		var dest_dir = './dump/';

		ncp(src_dir, dest_dir, function(err)
		{
			if(err)
			{
				return console.error(err);
			}
			console.log('files moved');
			var dot_rx = /[.]/;
			var src_dir = './dump/GZ/';
			var dest_dir = './dump/';

			fs.rename(dest_dir+'DataBase.bson', dest_dir+file+'.bson', function(err)
				{
					if(err)
					{
						return console.error('error: ' + err);
					}
				});	

			fs.rename(dest_dir+'DataBase.metadata.json', dest_dir+file+'.metadata.json', function(err)
				{
					if(err)
					{
						return console.error('error: ' + err);
					}
				});	

			console.log('files renamed');

			rmdir(file);

		});
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
	console.log('\nAttempting to remove old backups...\n'); 

 	var d = new Date();
	var _date = {};
	_date.year = d.getFullYear();
	_date.month = d.getMonth()-2;
	_date.day = d.getDate();
	_date.hour = d.getHours();
	_date.min = d.getMinutes();
	_date.timeString = d.toLocaleString();

	if(_date.month < 10)
		_date.month = '0' + _date.month;
	if(_date.day < 10)
		_date.day = '0' + _date.day;
	if(_date.hour < 10)
		_date.hour = '0' + _date.hour;
	if(_date.min < 10)
		_date.min = '0' + _date.min;

 	var temp_date = new Date();
 	temp_date.setMonth(temp_date.getMonth()-3);

	var remove_date_filename = 'DataBase_'+_date.year+_date.month+_date.day;


	console.log("searching for files on date: " + temp_date.toLocaleDateString());

 	glob("./dump/"+remove_date_filename+"*", function(err, files)
 	{
 		if(err)
 		{
 			console.log(err);
 			return;
 		}
 		else
 		{
 			if(files.length < 1)
 			{
 				console.log("There are no matches for files on that date.")
 			}
 			for(var i = 0; i < files.length; i++)
 			{
 				rmfile(files[i]);
 			}
 		}
 	});
}

//removes the specified file
//file must be the relative path from the working directory
function rmfile(file)
{
	if(file)
	{
		fs.unlink(file, function(err)
		{
			if(err)
			{
				console.log("backup file '" + file + "' not found.")
			}
			else
			{
				console.log("backup file '" + file + "' successfully removed");
			}
		})
	}
	else //if the bat file wasn't found, log a warning
	{
		console.log("File to remove was not specified");
	}
	return;
}

//removes the specified directory
function rmdir(filename)
{
	//if the bat file was found spawn it and send the filename
	if(filename)
	{
		rimraf('./dump/GZ', function(err)
		{
			if(err){console.error('error: ' + err)}
			console.log("MongoDump directories removed");
			console.log('\nData dump process completed.\n');	
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
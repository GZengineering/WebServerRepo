//watchdog.js
var fs = require('fs');
var child_process = require('child_process');
var spawn = child_process.spawn;

//check the operating system
var isWindows = /^win/.test(process.platform); //true if win32 || win64

//global variable to store the server child process
var server;

//server process running status flag
var running = false;

//Starts the server up
var startServer = function()
{
	//start the server process and store the child process in 'server'
	server = spawn("node", ["server.js"]);
	//flag the running status
	running = true;

	//on any data out from the server process, log it as it would log
	server.stdout.on('data', function(data)
	{
		console.log(data.toString());
	});

	//on any error data out from the server process, log it
	server.stderr.on('data', function(data)
	{
		console.log(data.toString());
	});

	//on server process exit, unflag the process flag and restart the server.
	server.on('close', function(code)
	{
		running = false;
		console.log('\n\nServer exited with code: ' + code);
		console.log('Server is restarting');
		restartServer();
	});
}

//kills the server if it is running and relaunches it.
//if it is not running, it simply starts the server back up
var restartServer = function()
{
	if(running)
	{	
		//run the windows taskkill process to kill the server based on the servers process ID
		if(isWindows)
		{
			var kill = spawn("taskkill", ["/PID", server.pid, "/F"]);
		}
		else
		{
			var kill = spawn("kill", ["-9", server.pid]);
		}

		//on data out, log it
		kill.stdout.on('data', function(data)
		{
			console.log(data.toString());
		});

		//on error data out, log it
		kill.stderr.on('data', function(data)
		{
			console.log(data.toString());
		});

		//on process close, log the exit code and restart the server after a few seconds.
		kill.on('close', function(code)
		{
			console.log('restart process exit code: ' + code);
			console.log('Server is restarting');
			setTimeout(function()
			{
				if(!running)
				{
					startServer();
				}
			}, 3000);
		});
	}
	else
	{
		startServer();
	}
}

if(!running)
{
	startServer();
}

setInterval(function()
{
	//if it's 3am restart the server
	var d = new Date();
	if(d.getHours() == 3 && d.getMinutes() == 0)
	{
		restartServer();
	}

}, 60*1000);

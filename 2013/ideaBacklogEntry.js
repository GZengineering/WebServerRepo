//ideaBacklogEntry.js

// var dojo = require('./dojo_source_1.8.3/dojo/dojo.js');

require([	'dojo/dom',
			'dijit/form/Button',
			'dijit/form/TextBox',
			'dojo/domReady!'
		], ideaBacklogEntry_Init);

ideaBacklogEntry_Init = function(dom, Button, TextBox)
{
	dom.byId('submit').onClick = submitHandler;
 }

submitHandler = function()
{
	console.log('Hello');
}
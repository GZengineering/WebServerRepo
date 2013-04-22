//ideaBacklogEntry.js

require([	'dojo/dom',
			'dijit/form/Button',
			'dijit/form/TextBox',
			'dojo/domReady!',
		], ideaBacklogEntry_Init);

ideaBacklogEntry_Init = function(dom, Button, TextBox)
{
	dom.byId('submit').onClick = submitHandler;

}

submitHandler = function()
{
	console.log('Hello');
}
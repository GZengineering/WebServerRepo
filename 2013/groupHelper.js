//groupHelper.js

// var Group = new Object();
// Group.group = new Array();
// var Groups = new Array();

// Group = 
// {
//     addToGroup: function(field)
//     {
//         Group.group.push(field);
//         console.log('\n');
//         for(i = 0; i < group.length; i++)
//             console.log('Group element: ' + group[i]);
//     },
// };

// Group.addToGroup('this');

function Group()
{
	this.group = new Array();
	this.addToGroup = addToGroup;

	function addToGroup(field)
	{
		this.group.push(field);
		console.log('\n');
        for(i = 0; i < this.group.length; i++)
            console.log('Group element: ' + this.group[i]);
	}
}

// var g = new Group();

// g.addToGroup('this');


exports.Group = Group;
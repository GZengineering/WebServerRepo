//parameterFunctions.js

function removeField(index)
{
    console.log('removal of ' + fields[i] + ' requested');
    // xhr.get(
    //     {
    //         url:"/parameter",
    //         content: 
    //         {
    //             action: 'removeField',
    //             value: fields[i],
    //             loaded: has_loaded=true,
    //         },
    //         load:function(response)
    //         {
    //             dom.byId("serverResponse").innerHTML = "Response from server: " + response;
    //         },
    //         error:function(error)
    //         {
    //             console.log("There was an error: \n"+error);
    //             dom.byId("serverResponse").innerHTML = "Response from server: " + error;
    //         }

    //     });
    console.log('xhr sent');
    console.log ("remove button pressed.");
}

// Build the table based on the contents returned from the handler
function buildTable(fields)
{
    fields.sort();
    console.log(fields.length);
    var table_html_string;
    //If there are some existing fields, build a table of them
    if(fields.length > 0)
    {
        table_html_string = "<table width = '250px' border = '1' ALIGN = center>" +
        '<tr>' +
        '<td style = "background-color:#E0E0E0; text-align:center"> <b>Available Fields</b>' +
        '</td>' +
        '</tr>';

        for(i = 0; i < fields.length; i++)
        {
            table_html_string += '<tr>' +
            '<div id = "field"'+i+'><td style = "background-color:#F0F0F0; width:90px; vertical-align:top;">' +
            fields[i].field_name +
            '</td></div>' + 
            '<td><a onclick = "removeField('+i+')">Remove</a></td>' +
            '</tr>';
        }
        table_html_string += '</table>';

    }
    //otherwise build a table and clarify there are no fields available
    else
    {
        table_html_string = "<table width = '250px' border = '1' ALIGN = center>" +
        '<tr>' +
        '<td style = "background-color:#E0E0E0; text-align:center"> <b>Available Fields</b>' +
        '</td>' +
        '</tr>' +
        '<tr>' +
        '<td style = "background-color:#F0F0F0; width:90px; vertical-align:top;">' +
        '<b> There Are No Fields Available </b>' +
        '</td></tr>' +
        '</table>';

    }
    // dom.byId('fieldList').innerHTML = table_html_string;
    console.log ("List refreshed");
    return table_html_string;
}

// function buildTable(fields)
// {
//     //var grid = registry.byId('fieldsGrid');

//     // var fieldStore = new dojo.data.ItemFileWriteStore(
//     // {
//     //     data: { items: fields }
//     // });

//     var itemList = 
//     [
//         {aliens: 500000},
//         {humans: 1000000},
//     ];

//     var fieldStore = new dojo.data.ItemFileWriteStore(
//     {
//         data: { items: itemList }
//     });

//     grid.setStore(fieldStore);

//     var grid = new dojox.grid.DataGrid(
//     {
//         store: fieldStore,
//     }, 'fieldsGrid');


// }

exports.buildTable = buildTable;
exports.removeField = removeField;
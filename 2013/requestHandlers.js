//requestHandlers.js
// This code was written by Alex Stout for Goal Zero, LLC private use


//get modules
var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable"),
    requestHelpers = require('./requestHelpers'),
    ObjectID = require('mongodb').ObjectID;
    // ideaBacklogEntry_script = requre('./ideaBacklogEntry')

//
function Home(response, request, collection, url) {
  console.log("\nRequest handler for 'Home' called.");
  var FieldQuery = url.parse(request.url,true).query;

  if(!FieldQuery.hasOwnProperty('Event'))
  {
    fs.readFile('./Home.html', function (err, html) 
    {
      if(err)
      {
         response.writeHead(404, {"Content-Type": "text/plain"});
         response.write(error + "\n");
         response.end();
      }
      else 
      {
        response.writeHead(200, {"Content-Type": "text/html"});       
        response.write(html);
        response.end();
        console.log('loading Home Page');
      }
    });
  }
}    

function favicon(response, request, collection, url)
{
  //Read and display the favicon
  fs.readFile('./favicon.ico', function (err, ico) 
  {
      response.writeHead(200, {"Content-Type": "text/html"});       
      response.write(ico);
      response.end();
  });
}

function upload(response, request) {
  console.log("\nRequest handler 'upload' was called.");

  var form = new formidable.IncomingForm();
  console.log("about to parse");
  form.parse(request, function(error, fields, files) {
  console.log("parsing done");

    /* Possible error on Windows systems:
       tried to rename to an already existing file */
    fs.rename(files.upload.path, "/tmp/test.png", function(err) {
      if (err) {
        fs.unlink("/tmp/test.png");
        fs.rename(files.upload.path, "/tmp/test.png");
      }
    });
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("received image:<br/>");
    response.write("<img src='/show' />");
    response.end();
  });
}

function show(response) {
  console.log("\nRequest handler 'show' was called.");
  fs.readFile("/tmp/test.png", "binary", function(error, file) {
    if(error) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(error + "\n");
      response.end();
    } else {
      response.writeHead(200, {"Content-Type": "image/png"});
      response.write(file, "binary");
      response.end();
    }
  });
}

//
function ideaBacklogEntry(response, request, collection, url)
{
    requestHelpers.return_html('./ideaBacklogEntry.html', response);
    requestHelpers.return_js('./ideaBacklogEntry.js', response);
}

//Some member variables for the parameter handler
var Parameter = new Object();
Parameter.outPutTextElements = new Array();
Parameter.outPutString;

//A member function that adds a matched element to the array of output data.
Parameter.addElement = function(element)
{
  console.log('element to add: ' + element);
  Parameter.outPutTextElements.push(element);
  console.log('element at end of array: ' + Parameter.outPutTextElements[Parameter.outPutTextElements.length - 1]);
  console.log('outPutTextElements.length: ' + Parameter.outPutTextElements.length);
  for(var i = 0; i < Parameter.outPutTextElements.length; i ++)
    console.log('Element #'+i + ': ' + Parameter.outPutTextElements[i]);
}

//A function that builds the output string based on the data in the array.
Parameter.buildOutputString = function()
{
  Parameter.outPutString = '';
  for(var i = 0; i < Parameter.outPutTextElements.length; i++)
  {
    Parameter.outPutString += '' + Parameter.outPutTextElements[i];
  }
}

/*
* This is the handler for the parameter page.  This page is used to
* manage the lowest level of a products specs.  The user can add and
* remove fields. There is also a live list view of the available fields.
*/
function parameter (response, request, collection, url) 
{
  //parse url
  console.log("\nRequest handler 'parameter'");
  var FieldQuery = url.parse(request.url,true).query;

  // Return the main page if the page hasn't loaded yet.
  if(!FieldQuery.loaded)
  {
    requestHelpers.return_html('./param2.html', response); //changed to load Parameter Builder 2.0
  }
 
  //If there was an insertion requested, add the entry to the db, initialize its value to null.
  if(FieldQuery.action == 'new_pi')
  {
    var pi = eval('(' + FieldQuery.pi + ')');
    //Save the new field to the db only if it's a unique name, don't allow duplicates
    collection.save({'type': 'param_individual', 'pi_name': pi.pi_name, 'pi_type' : 'fixed', 'pi_value':pi.pi_value, 'pi_unit': pi.pi_unit, 'pi_def':undefined});
    collection.find({'type': 'param_individual', 'pi_name': pi.pi_name, 'pi_type' : 'fixed', 'pi_value':pi.pi_value, 'pi_unit': pi.pi_unit, 'pi_def':undefined}).toArray(
      function(error, doc)
      {
        if(doc)
        {
          var string = JSON.stringify(doc[0]);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        else if(error)
        {
          console.log('New Parameter: Failure to Add New');
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('Failure to Add \' '+ pi.pi_name + ' \' .');
          response.end();
        }
      }
    );
    //Send the response back to the page
    
  }

  //If there is a removal requested, remove the field from the db if it exists
  if(FieldQuery.action == 'removeField')
  {
    var pi = eval('('+FieldQuery.pi+')');
    var oid = new ObjectID(pi._id);
    collection.findAndRemove({'_id':oid}, 
    function(error, result)
    {
      //If it's found and removed successfully, report it.
      if(result!=null)
      {
        console.log('Field Removal: successful');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(pi.pi_name + ' successfully removed');
        response.end();
      }
      //otherwise, report that the field wasn't found
      else
      {
        console.log('Field Removal: nothing to remove');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove \' '+ pi.pi_name + ' \' : Field not found.');
        response.end();
      }
    });
  }

  //This is called on every change to the db and on page load
  //This is the full list of available fields
  if(FieldQuery.action == 'getFields')
  {
    //Get the list of fields from the db
    collection.find({'pi_type':'fixed'}).toArray(
      function(error, result)
      {
        //If there's something returned from the db, send it to the page as
        //a JSON object
        if(result!=null)
        {
          var string = JSON.stringify(result);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        //Otherwise, let the page know, it's empty
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getFields':" + error + '\n');
        }
      });
  }

  if(FieldQuery.action == 'getCompFields')
  {
    //Get the list of fields from the db
    collection.find({'pi_type':'computed'}).toArray(
      function(error, result)
      {
        //If there's something returned from the db, send it to the page as
        //a JSON object
        if(result!=null)
        {
          var string = JSON.stringify(result);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        //Otherwise, let the page know, it's empty
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getCompFields':" + error + '\n');
        }
      });
  }

  //If there was an insertion requested, add the entry to the db, initialize its value to null.
  if(FieldQuery.action == 'newCompField')
  {
    var pi = eval('(' + FieldQuery.pi + ')');
    //Save the new field to the db only if it's a unique name, don't allow duplicates
    collection.save({'type': 'param_individual', 'pi_name': pi.pi_name, 'pi_type':'computed', 'pi_value': undefined, 'pi_unit': undefined, 'pi_def':pi.pi_def},
      function(error, doc)
      {
        if(doc)
        {
          console.log(JSON.stringify(doc));
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(JSON.stringify(doc));
          response.end();
        }
        else if(error)
        {
          console.log('New Parameter: Failure to Add New');
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('Failure to Add \' '+ pi.pi_name + ' \' .');
          response.end();
        }
      });
  }

  if(FieldQuery.action == 'removeCompField')
  {
    var pi = eval('(' + FieldQuery.pi + ')');
    collection.findAndRemove({'type': 'param_individual', 'pi_name': pi.pi_name, 'pi_def': pi.pi_def},
    function(error, result)
    {
      //If it's found and removed successfully, report it.
      if(result!=null)
      {
        console.log('Comp Field Removal: successful');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(pi.pi_name + ' successfully removed');
        response.end();
      }
      //otherwise, report that the field wasn't found
      else
      {
        console.log('Comp Field Removal: nothing to remove');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove \' '+ pi.pi_name + ' \' : Field not found.');
        response.end();
      }
    });
  }

  //Parses the definition for a computed field into a user friendly, readable output text
  //specifically used for nice report output.
  //It gets the definition string from the page, splits it into an array of elements
  //requests all the fields from the db, and compares the elements in the definition
  //to those returned from the db, if there's a match, we get the appropriate data
  //and build an array that contains the data for the output string.
  //once the definition is depleted, we build the string using the array built on the
  //matched data.  Yup, it's pretty inefficient. 
  if(FieldQuery.action == 'parseDef')
  {
    var definition = FieldQuery.definition; //the definition string from the page
    var def_elements = definition.split(";"); //split the string into elements by ';'
    Parameter.outPutTextElements = new Array(); //the array to contain the output data
    //get all the fields so we can find the data we need
    collection.find({'type': 'param_individual'}).toArray(
      function (error, result)
      {
        //if we get something back
        if(result!=null)
        {
          //go through each element of the definition until it's depleted
          while(def_elements.length > 0)  
          {
            var notFound = true;
            var r; // the temp var to store the output data
            var element = def_elements.shift();
            try
            {
              var element = eval("(" + element + ")"); //turn the current element into an object
              console.log(element);
            }
            catch (err)
            {
              if(err == SyntaxError)
              {
                console.log('Error: SyntaxError' + err);
                Parameter.addElement(element);
                continue;
              }
              else
              {
                console.log('Error: ' + err);
              }
            }
            if(element.f != null) //if this element has a field property
            {
              console.log('ELEMENT: ' + JSON.stringify(element));
              //find the match in the set of fields from the db
              for(var i = 0; i < result.length; i++)
              {
                //if we find a match
                if(element.f == result[i].pi_name)
                {
                  //determine which property was requested
                  //value or unit
                  if(element.p == 'value')
                    r = result[i].pi_value;
                  else
                    r = result[i].pi_unit;
                  //Add the element to the array
                  Parameter.addElement(r);
                  notFound = false;
                  break;
                }
                //otherwise go to the next element from the db
              }
              //if we never find a match, stick a note in the output string for the missing element
              if(notFound)
                Parameter.addElement('(No Match: ' + element.f + ')');
            }
            //if the element doesn't possess any properties, it must be a string
            //so add the string to the output
            else
            {
              Parameter.addElement(element);
            }
          }
          //Once we've depleted the definition set
          if(def_elements.length < 1)
          {
            //build the output string
            Parameter.buildOutputString();
            //and give the string back to the page
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(Parameter.outPutString);
            response.end();
          }
        }
        //Otherwise, let the page know it's empty
        else
        {
          console.log('!!! Here !!!: 2');
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log('!!! Here !!!: 3');
          console.log("\nError in 'ParseDef':" + error + '\n');
        }
      }
    );
  }
}


function group(response, request, collection, url)
{
  console.log("\nRequest handler 'group'");
  var FieldQuery = url.parse(request.url,true).query;

  // Return the main page if the page hasn't loaded yet.
  if(!FieldQuery.loaded)
  {
    requestHelpers.return_html('./group.html', response);
  }

  if(FieldQuery.action == 'getFieldsWithId')
  {
    console.log(FieldQuery.id);
    var mongo = require('mongodb');
    var BSON = mongo.BSONPure;
    var o_id = new BSON.ObjectID(FieldQuery.id);
    console.log(o_id);
    collection.find({'_id':o_id}).toArray(
      function(error, result)
      {
        if(result!=null)
        {
          var string = JSON.stringify(result);
          console.log(string);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        //Otherwise, let the page know, it's empty
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getFieldsWithId':" + error + '\n');
        }
      });
  }

  //This is called on every change to the db and on page load
  //This is the full list of available fields
  if(FieldQuery.action == 'getFields')
  {
    //Get the list of fields from the db
    collection.find({'type':'param_individual'}).toArray(
      function(error, result)
      {
        //If there's something returned from the db, send it to the page as
        //a JSON object
        if(result!=null)
        {
          var string = JSON.stringify(result);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        //Otherwise, let the page know, it's empty
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getFields':" + error + '\n');
        }
      });
  }

  if(FieldQuery.action == 'getFieldsOfSelectedGroup')
  {
    if(!FieldQuery.group_name)
    {
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write('--undefined--');
      response.end();
    }
    else
    {
      collection.find({'pg_name': FieldQuery.group_name}).toArray( 
        function(error, result)
        {
          console.log("RESULT: " + result);
          if(result.length > 0)
          {
            console.log("Case 1");
            console.log(result[0].fields[0]);
            var fieldsAsString = JSON.stringify(result[0].fields);
            console.log(fieldsAsString);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(fieldsAsString);
            response.end();
          }
          else
          {
            console.log("Case 2");
            response.writeHead(200, {"Content-Type": "text/plain"});
            // response.write("empty");
            response.end();
          }
          //If there's an error, log it.
          if(error)
          {
            console.log("Case 3");
            console.log("\nError in 'getGroups':" + error + '\n');
          }
        });
    }
  }

  if(FieldQuery.action == 'getGroups')
  {
    //Get the list of fields from the db
    collection.find({'type':'param_group'}).toArray(
      function(error, result)
      {
        //If there's something returned from the db, send it to the page as
        //a JSON object
        if(result!=null)
        {
          var string = JSON.stringify(result);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        //Otherwise, let the page know, it's empty
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getGroups':" + error + '\n');
        }
      });
  }

  if(FieldQuery.action == 'newGroup')
  {
    var group_fields = new Array();
    for(var f in FieldQuery.group_fields)
    {
      var temp = eval('(' + FieldQuery.group_fields[f] + ')');
      group_fields.push(temp);
    }

    collection.find({'type': 'param_group', 'pg_name': FieldQuery.group_name}).toArray( 
      function(error, result)
      {
        if(error)
        {
          console.log('Error: ' + error);
        }
        else
        {
          if(result.length == 1)
          {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('A Group with name — \'' + FieldQuery.group_name + '\' already exists');
            response.end();
          }
          else if(result.length == 0)
          {
            collection.save({'type': 'param_group', 'pg_name': FieldQuery.group_name, 'pg_type': FieldQuery.pg_type, 'fields' : group_fields});
            collection.ensureIndex({'group_name':1},{unique: true, sparse: true, dropDups: true});
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('New Group — \'' + FieldQuery.group_name + '\' successfully added');
            response.end();
          }
        }
      });
  }

  if(FieldQuery.action == 'removeGroup')
  {
    collection.findAndRemove({'pg_name' : FieldQuery.group_name},
      function(error, result)
    {
      if(result!=null)
      {
        console.log('Removal of Group: ' + FieldQuery.group_name + ' Succeeded');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Group \'' + FieldQuery.group_name + '\' successfully removed');
        response.end();
      }
      else
      {
        console.log('Removal of Group: ' + FieldQuery.group_name + 'Failed');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove Group\' '+ FieldQuery.group_name + ' \' : Group not found.');
        response.end();
      }
    });
  }

  if(FieldQuery.action == 'updateFields')
  {
    var fields = eval('(' + FieldQuery.fields + ')'); //parse the passed JSON string as a JSON object
    // var specs = FieldQuery.specs;
    for(var i = 0;i<fields.length;i++)
    {
      console.log('Handler Specs: ' + fields[i].pi_name);
    }

    collection.find({'pg_name': FieldQuery.group_name}).toArray( 
      function(error, result)
      {
        if(error)
        {
          console.log('Error: ' + error);
        }
        else
        {
          if(result.length == 1)
          {
            console.log('specs added to db as: ' + JSON.stringify(fields));
            collection.update({'pg_name': FieldQuery.group_name},
              {'type':'param_group', 'pg_name':FieldQuery.group_name, 'pg_type' : FieldQuery.pg_type, 'fields' : fields});
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('Group — \'' + FieldQuery.group_name + '\' successfully updated');
            response.end();
          }
          else if(result.length == 0)
          {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('Group with name — \'' + FieldQuery.group_name + '\' Not Found');
            response.end();
          }
        }
      });
  }
}

//Handler for product builder page
function productBuilder(response, request, collection, url)
{
  console.log("\nRequest handler 'Product Builder'");
  var FieldQuery = url.parse(request.url,true).query;

  // Return the main page if the page hasn't loaded yet.
  if(!FieldQuery.loaded)
  {
    requestHelpers.return_html('./productBuilder.html', response);
  }

  if(FieldQuery.action == 'getFieldsOfSelectedGroup')
  {
    collection.find({'pg_name': FieldQuery.group_name}).toArray( 
      function(error, result)
      {
        if(result!=null)
        {
          var objString = JSON.stringify(result);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(objString);
          response.end();
        }
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getFieldsOfSelectedGroup':" + error + '\n');
        }
      });
  }

  if(FieldQuery.action == 'removeFamily')
  {
    collection.findAndRemove({'pf_name' : FieldQuery.product_name},
      function(error, result)
    {
      if(result!=null)
      {
        console.log('Removal of Product: ' + FieldQuery.product_name + ' Succeeded');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Product \'' + FieldQuery.product_name + '\' successfully removed');
        response.end();
      }
      else
      {
        console.log('Removal of Product: ' + FieldQuery.product_name + 'Failed');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove Group\' '+ FieldQuery.product_name + ' \' : Product not found.');
        response.end();
      }
    });
  }

  if(FieldQuery.action == 'newProduct')
  {
    var group_field_sets = new Array();
    var selected = eval('(' + FieldQuery.selected + ')'); //parse the passed JSON string as a JSON object

    collection.find({'type': 'param_family', 'pf_name': FieldQuery.product_name}).toArray( 
      function(error, result)
      {
        if(error)
        {
          console.log('Error: ' + error);
        }
        else
        {
          if(result.length == 1)
          {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('A Product with name — \'' + FieldQuery.product_name + '\' already exists');
            response.end();
          }
          else if(result.length == 0)
          {
            var i;
            for(i=0;i<selected.length;i++)
            {
              selected[i].value = 0;
            }

            collection.save({'type': 'param_family', 'pf_name': FieldQuery.product_name, 'pf_type' : FieldQuery.pf_type, 'specs' : selected});
            collection.ensureIndex({'product_name':1},{unique: true, sparse: true, dropDups: true});
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('New Product — \'' + FieldQuery.product_name + '\' successfully added');
            response.end();

          }
        }
      });
  }

  if(FieldQuery.action == 'getProducts')
  {
    //Get the list of fields from the db
    collection.find({'type':'param_family'}).toArray(
      function(error, result)
      {
        //If there's something returned from the db, send it to the page as
        //a JSON object
        if(result!=null)
        {
          var string = JSON.stringify(result);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        //Otherwise, let the page know, it's empty
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getProducts':" + error + '\n');
        }
      });
  }

  if(FieldQuery.action == 'getSpecs')
  {
    collection.find({'pf_name': FieldQuery.product_name}).toArray(
      function(error, product)
      {
        if(error)
        {
          console.log('Error: ' + error);
        }
        else if(!product)
        {
          console.log('--Here!-- # 1: ');
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        else
        {
          var string = JSON.stringify(product);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
      });
  }

  if(FieldQuery.action == 'updateSpecs')
  {
    var specs = eval('(' + FieldQuery.specs + ')'); //parse the passed JSON string as a JSON object
    // var specs = FieldQuery.specs;
    for(var i = 0;i<specs.length;i++)
    {
      console.log('Handler Specs: ' + specs[i].value);
    }

    collection.find({'type': 'param_family', 'pf_name': FieldQuery.product_name}).toArray( 
      function(error, result)
      {
        if(error)
        {
          console.log('Error: ' + error);
        }
        else
        {
          if(result.length == 1)
          {
            console.log('specs added to db as: ' + JSON.stringify(specs));
            collection.update({'pf_name': FieldQuery.product_name},
              {'type' : 'param_family', 'pf_name' : FieldQuery.product_name, 'pf_type' : FieldQuery.product_type, 'specs' : specs});
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('Product — \'' + FieldQuery.product_name + '\' successfully updated');
            response.end();
          }
          else if(result.length == 0)
          {
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('A Product with name — \'' + FieldQuery.product_name + '\' Not Found');
            response.end();
          }
        }
      });
  }

}

function specReports(response, request, collection, url)
{
  console.log("\nHandler 'Spec Reports' requested");
  var FieldQuery = url.parse(request.url,true).query;

  // Return the main page if the page hasn't loaded yet.
  if(!FieldQuery.loaded)
  {
    requestHelpers.return_html('./specReports.html', response);
  }
}

function viewBuilder(response, request, collection, url)
{
  console.log("\nRequest handler 'Product Builder'");
  var FieldQuery = url.parse(request.url,true).query;

  // Return the main page if the page hasn't loaded yet.
  if(!FieldQuery.loaded)
  {
    requestHelpers.return_html('./viewBuilder.html', response);
  }

  if(FieldQuery.action == 'getProducts')
  {
    //Get the list of fields from the db
    collection.find({'type':'product'}).toArray(
      function(error, result)
      {
        //If there's something returned from the db, send it to the page as
        //a JSON object
        if(result!=null)
        {
          var string = JSON.stringify(result);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
        //Otherwise, let the page know, it's empty
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        //If there's an error, log it.
        if(error)
        {
          console.log("\nError in 'getProducts':" + error + '\n');
        }
      });
  }

  if(FieldQuery.action == 'getSpecs')
  {
    collection.find({'product_name': FieldQuery.product_name}).toArray(
      function(error, product)
      {
        if(error)
        {
          console.log('Error: ' + error);
        }
        else if(!product)
        {
          console.log('--Here!-- # 1: ');
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('--empty--');
          response.end();
        }
        else
        {
          var string = JSON.stringify(product);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(string);
          response.end();
        }
      });
  }
}


// exports.UnitClassArray = UnitClassArray; 
exports.favicon = favicon;
exports.ideaBacklogEntry = ideaBacklogEntry;
exports.specReports = specReports;
exports.viewBuilder = viewBuilder;
exports.productBuilder = productBuilder;
exports.group = group;
exports.parameter = parameter;
exports.upload = upload;
exports.show = show;
exports.Home = Home;
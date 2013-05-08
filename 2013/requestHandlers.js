//requestHandlers.js
// This code was written by Alex Stout for Goal Zero, LLC private use


//get modules
var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable"),
    requestHelpers = require('./requestHelpers'),
    express = require('express'),
    app = express();
    ObjectID = require('mongodb').ObjectID;


function dojo_css (response, request, collection, url)
{
  requestHelpers.return_css('dojo_source_1.8.3/dojo/resources/dojo.css', response);
}

function db_data (response, request, collection, url)
{
  fs.readFile('./db.json', function (err, file) 
  {
      response.writeHead(200, {"Content-Type": "text/html"});
      response.write(file);
      response.end();
  });
}    

function dump (response, request, collection, url)
{
  var FieldQuery = url.parse(request.url,true).query;
  collection.find().toArray(
      function(error, result)
      {
        //If there's something returned from the db, send it to the page as
        //a JSON object
        if(result!=null)
        {
          var db_as_json = '';
          for(var i = 0; i < result.length; i++)
          {
            db_as_json += JSON.stringify(result[i]);
            if(i != result.length-1)
              db_as_json += '\n';
          }
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(db_as_json);
          response.end();
          _writeFile("db.json", db_as_json);
        }
        //If there's an error, log it.
        else if(error)
        {
          console.log("\nError in 'getFields':" + error + '\n');
        }
      });
}

function update_db_from_file(response, request, collection, url)
{
  var spawn = require('child_process').spawn,
      mongoimport = spawn('../../../mongodb/bin/mongoimport', ['--db', 'GZ', '--collection', 'DataBase', '--file', 'db.json', '--upsert',  '--journal']);
      
  mongoimport.stdout.on('data', function(data)
  {
    console.log('stdout: ' + data);
  });

  mongoimport.stderr.on('data', function(data)
  {
    console.log('stderr ' + data);
  });

  mongoimport.on('close', function(code)
  {
    console.log('process exited with code: ' + code);
  });

  response.end();  
}

function _writeFile(filename, data)
{
  fs.writeFile(filename, data, function(err)
  {
    if (err) throw err;
    console.log('DB file dumped');
  })
}

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
         response.write(err + "\n");
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
    fs.rename(files.upload.path, "db.json", function(err) {
      if (err) {
        fs.unlink("db.json");
        fs.rename(files.upload.path, "db.json");
      }
    });
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("upload successful");
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

//returns the pi javascript
function parameter_js (response, request, collection, url)
{
  requestHelpers.return_js('./parameter.js', response);
}


/*
* This is the handler for the parameter page.  This page is used to
* manage the lowest level of a products specs.  The user can add and
* remove fields. There is also a live list view of the available fields.
*/
function individual (response, request, collection, url) 
{
  //parse url
  console.log("\nRequest handler 'individual'");
  var FieldQuery = url.parse(request.url,true).query;

  // Return the main page if the page hasn't loaded yet.
  if(!FieldQuery.loaded)
  {
    requestHelpers.return_html('./individual.html', response); //changed to load Parameter Builder 2.0
  }
 
  //If there was an insertion requested, add the entry to the db, initialize its value to null.
  if(FieldQuery.action == 'new_pi')
  {
    var pi = eval('(' + FieldQuery.pi + ')');
    //Save the new field to the db only if it's a unique name, don't allow duplicates
    collection.save({'type': 'param_individual', 'pi_name': pi.pi_name, 'pi_type' : pi.pi_type, 'pi_value':pi.pi_value, 'pi_unit': pi.pi_unit, 'pi_def':pi.pi_def});
    collection.find({'type': 'param_individual', 'pi_name': pi.pi_name, 'pi_type' : pi.pi_type, 'pi_value':pi.pi_value, 'pi_unit': pi.pi_unit, 'pi_def':pi.pi_def}).toArray(
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
  }

  //If there is a removal requested, remove the field from the db if it exists
  if(FieldQuery.action == 'remove_pi')
  {
    var pi = eval('('+FieldQuery.pi+')');
    console.log(pi._id);
    console.log('is this where I am?')
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
        return;
      }
      else
      {
        collection.findAndRemove({'_id':pi._id},
        function(error, result)
        {
          //If it's found and removed successfully, report it.
          if(result!=null)
          {
            console.log('Field Removal: successful');
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(pi.pi_name + ' successfully removed');
            response.end();
            return;
          }
          //otherwise, report that the field wasn't found
          else
          {
            console.log('Field Removal: nothing to remove for name - ' + pi.pi_name + ' :: oID - ' + pi._id);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('Failure to Remove \' '+ pi.pi_name + ' \' : Field not found.');
            response.end();
          }
        });
      }
    });
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

  if(FieldQuery.action == 'new_pg')
  {
    var pg = eval('('+FieldQuery.pg+')');
    var pi_ids = new Array();
    for(var f in pg.pi_ids)
    {
      var oid = new ObjectID(pg.pi_ids[f]);
      pi_ids.push(oid);
    }

    collection.find({'type': 'param_group', 'pg_name': pg.pg_name}).toArray( 
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
            collection.save({'type': 'param_group', 'pg_name': pg.pg_name, 'pg_type': pg.pg_type, 'pi_ids' : pi_ids});
            // collection.ensureIndex({'group_name':1},{unique: true, sparse: true, dropDups: true});
            collection.find({'type': 'param_group', 'pg_name': pg.pg_name, 'pg_type': pg.pg_type, 'pi_ids' : pi_ids}).toArray(
              function(error, doc)
              {
                if(doc)
                {
                  var string = JSON.stringify(doc[0]);
                  console.log('New pg: \'' + pg.pg_name + '\' added');
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write(string);
                  response.end();
                }
                else if(error)
                {
                  console.log('New Group: Failure to Add - ' + pg.pg_name);
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write('Failure to Add \' '+ pg.pg_name + ' \' .');
                  response.end();
                }
              }
            );
          }
        }
      });
  }

  if(FieldQuery.action == 'remove_pg')
  {
    var pg = eval('('+FieldQuery.pg+')');
    console.log(pg._id);
    var oid = new ObjectID(pg._id);
    collection.findAndRemove({'_id':oid}, 
      function(error, result)
    {
      if(result!=null)
      {
        console.log('Removal of Group: ' + pg.pg_name + ' Succeeded');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Group \'' + pg.pg_name + '\' successfully removed');
        response.end();
      }
      else
      {
        console.log('Removal of Group: ' + pg.pg_name + ' Failed');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove Group\' '+ pg.pg_name + ' \' : Group not found.');
        response.end();
      }
    });
  }
}

//Handler for product builder page
function family(response, request, collection, url)
{
  console.log("\nRequest handler 'Product Builder'");
  var FieldQuery = url.parse(request.url,true).query;

  // Return the main page if the page hasn't loaded yet.
  if(!FieldQuery.loaded)
  {
    requestHelpers.return_html('./family.html', response);
  }

  if(FieldQuery.action == 'remove_pf')
  {
    var pf = eval('('+FieldQuery.pf+')');
    console.log(pf._id);
    var oid = new ObjectID(pf._id);
    collection.findAndRemove({'_id':oid}, 
      function(error, result)
    {
      if(result!=null)
      {
        console.log('Removal of Family: ' + pf.pf_name + ' Succeeded');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Group \'' + pf.pf_name + '\' successfully removed');
        response.end();
      }
      else
      {
        console.log('Removal of Group: ' + pf.pf_name + ' Failed');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove Group\' '+ pf.pf_name + ' \' : Group not found.');
        response.end();
      }
    });
  }

  if(FieldQuery.action == 'new_pf')
  {

    var pf = eval('('+FieldQuery.pf+')');
    var pg_ids = new Array();
    for(var pg in pf.pg_ids)
    {
      var oid = new ObjectID(pf.pg_ids[pg]);
      pg_ids.push(oid);
    }

    collection.find({'type': 'param_family', 'pf_name': pf.pf_name}).toArray( 
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
            response.write('A Group with name — \'' + FieldQuery.family_name + '\' already exists');
            response.end();
          }
          else if(result.length == 0)
          {
            collection.save({'type': 'param_family', 'pf_name': pf.pf_name, 'pf_type': pf.pf_type, 'pg_ids' : pg_ids});
            // collection.ensureIndex({'group_name':1},{unique: true, sparse: true, dropDups: true});
            collection.find({'type': 'param_family', 'pf_name': pf.pf_name, 'pf_type': pf.pf_type, 'pg_ids' : pg_ids}).toArray(
              function(error, doc)
              {
                if(doc)
                {
                  var string = JSON.stringify(doc[0]);
                  console.log('New pf: \'' + pf.pf_name + '\' added');
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write(string);
                  response.end();
                }
                else if(error)
                {
                  console.log('New Family: Failure to Add - ' + pf.pf_name);
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write('Failure to Add \' '+ pf.pf_name + ' \' .');
                  response.end();
                }
              }
            );
          }
        }
      }
    );
  }
}

function global(response, request, collection, url)
{
  console.log("\nHandler '/global' requested");
  var FieldQuery = url.parse(request.url,true).query;
  if(FieldQuery.action == 'getAll')
  {
    collection.find().toArray(
      function(error, result)
      {
        if(result)
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
        if(error)
        {
          console.log("\nError in 'getAll':" + error + '\n');
        }

      })
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
exports.dojo_css = dojo_css;
exports.db_data = db_data;
exports.update_db = update_db_from_file;
exports.parameter_js = parameter_js; 
exports.favicon = favicon;
exports.ideaBacklogEntry = ideaBacklogEntry;
exports.specReports = specReports;
exports.viewBuilder = viewBuilder;
exports.family = family;
exports.global = global;
exports.group = group;
exports.individual = individual;
exports.upload = upload;
exports.show = show;
exports.Home = Home;
exports.dump = dump;
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
  requestHelpers.return_css('../../../dojo_source_1.8.3/dojo/resources/dojo.css', response);
}

function db_data (response, request, collection, url)
{
  fs.readFile('./db.json', function (err, file) 
  {
      response.writeHead(200, {"Content-Type": "text/file"});
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
          response.writeHead(200, {"Content-Type": "text/file"});
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

function param_app(response, request, collection, url)
{
  requestHelpers.return_html('./param_app.html', response);
}

function upload(response, request) {
  console.log("\nRequest handler 'upload' was called.");

  var form = new formidable.IncomingForm();
  form.parse(request, function(error, fields, files) {

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
  if(FieldQuery.action == 'new_param_class')
  {
    var param_class = eval('(' + FieldQuery.param_class + ')');
    collection.find({'type': 'param_class', 'name': param_class.name}).toArray(
      function(error, doc)
      {
        if(doc.length > 0)
        {
          console.log('Attempted to add existing Parameter Class: \'' + param_class.name + '\'');
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(JSON.stringify(new Object()));
          response.end();
        }
        else if(error)
        {
          console.log('New Parameter Class: Failure to Add New');
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('Failure to Add \' '+ param_class.name + ' \' .');
          response.end();
        }
        else
        {
          console.log('Attempting to add new Parameter Class: \'' + param_class.name + '\'');
          collection.save(param_class);
          collection.find(param_class).toArray(
          function(error, result)
          {
            if(result)
            {
              console.log('Parameter Class \'' + param_class.name + '\' saved successfully');
              var s = JSON.stringify(result[0]);
              s = JSON.stringify(param_class);
                response.writeHead(200, {"Content-Type": "text/plain"});
                response.write(s);
                response.end();
              // if(!typeof(s) == 'string')
              // {
              //   s = JSON.stringify(param_class);
              //   response.writeHead(200, {"Content-Type": "text/plain"});
              //   response.write(s);
              //   response.end();
              // }
              // else
              // {
              //   s = JSON.stringify(param_class);
              //   console.log(s);
              //   response.writeHead(200, {"Content-Type": "text/plain"});
              //   response.write(s);
              //   response.end();
              // }
              
            }
            else if(error)
            {
              response.writeHead(200, {"Content-Type": "text/plain"});
              response.write('ERROR');
              response.write(error);
              response.end();
            }
            else
            {
              console.log('Error: There might be more than 1\'' + param_class.name + '\' in the db');
              response.writeHead(200, {"Content-Type": "text/plain"});
              response.write('UNKOWN ERROR');
              response.end();
            }
          });
        }
      }
    );
  }

  if(FieldQuery.action == 'change_parameters')
  {
    var parameters = eval('('+FieldQuery.parameters+')');
    var saved = [];
    var errorCount = 0;

    response.writeHead(200, {"Content-Type": "text/plain"});


    while(parameters.length > 0)
    {
      var doc = parameters.shift()
      var s = JSON.stringify(doc);

      var oid = new ObjectID(doc._id);
      doc._id = oid;

      collection.save(doc);
      collection.find(doc).toArray(
        function(error, result)
        {
          if(error)
          {
            console.log("Error saving '"+doc.name+"' :: " + error);
            response.write("Error saving '"+doc.name+"' :: " + error);
            errorCount++;
          }
          else if(result[0])
          {
            saved.push(result[0]);
            console.log("Doc '"+doc.name+"' Saved successfully");
            response.write("'"+doc.name+"' Saved successfully");
            finish();
          }
        }
      );
    }
    function finish()
    {
      console.log("::DONE::\n"+saved.length+" documents successfully saved. :: "+errorCount+" failures.\n");
      response.write('DONE');
      response.end();
    }
  }

  //If there is a removal requested, remove the field from the db if it exists
  if(FieldQuery.action == 'remove_param_class')
  {
    var param_class = eval('('+FieldQuery.param_class+')');
    var oid = new ObjectID(param_class._id);
    collection.findAndRemove({'_id':oid}, 
    function(error, result)
    {
      //If it's found and removed successfully, report it.
      if(result!=null)
      {
        console.log('Field Removal: successful');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(param_class.name + ' successfully removed');
        response.end();
        return;
      }
      else
      {
        collection.findAndRemove({'_id':param_class._id},
        function(error, result)
        {
          //If it's found and removed successfully, report it.
          if(result!=null)
          {
            console.log('Field Removal: successful');
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(param_class.name + ' successfully removed');
            response.end();
            return;
          }
          //otherwise, report that the field wasn't found
          else
          {
            console.log('Field Removal: nothing to remove for name - ' + param_class.name + ' :: oID - ' + param_class._id);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write('Failure to Remove \' '+ param_class.name + ' \' : Field not found.');
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

  if(FieldQuery.action == 'update_pg')
  {
      var doc = eval('('+FieldQuery.pg+')');
      var s = JSON.stringify(doc);

      var oid = new ObjectID(doc._id);
      doc._id = oid;

      collection.save(doc,
        function(error, result)
        {
          if(error)
          {
            console.log("Error saving '"+doc.name+"' :: " + error);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write("Error saving '"+doc.name+"' :: " + error);
            response.end();
            return;
          }
          else
          {
            console.log("Doc '"+doc.name+"' Saved successfully");
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write("Group '"+doc.name+"' Saved successfully");
            response.end();
            return;
          }
        }
      );
  }

  if(FieldQuery.action == 'new_pg')
  {
    var pg = eval('('+FieldQuery.pg+')');

    collection.find({'type': 'pg', 'name': pg.name}).toArray( 
      function(error, result)
      {
        if(error)
        {
          console.log('Error: ' + error);
          var r = JSON.stringify(new Object({msg: "ERROR: can't find " + pg.name}));
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write(r);
          response.end();
        }
        else
        {
          if(result.length == 1)
          {
            response.writeHead(200, {"Content-Type": "text/plain"});
            var r =  JSON.stringify({});
            response.write(r);
            response.end();
          }
          else if(result.length == 0)
          {
            collection.save({'type': 'pg', 'name': pg.name, 'members' : pg.members});
            // collection.ensureIndex({'group_name':1},{unique: true, sparse: true, dropDups: true});
            collection.find({'type': 'pg', 'name': pg.name, 'members' : pg.members}).toArray(
              function(error, doc)
              {
                if(doc) 
                {
                  var string = JSON.stringify(doc[0]);
                  console.log('New pg: \'' + pg.name + '\' added');
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  if(typeof string !== 'string')
                  {
                    console.log("Error: Object couldn't be converted to a string");
                    response.write(FieldQuery.pg);
                  }
                  else
                  {
                    response.write(string);
                  }
                  response.end();
                }
                else if(error)
                {
                  console.log('New Group: Failure to Add - ' + pg.name);
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write('Failure to Add \' '+ pg.name + ' \' .');
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
    var oid = new ObjectID(pg._id);
    collection.findAndRemove({'_id':oid}, 
      function(error, result)
    {
      if(result!=null)
      {
        console.log('Removal of Group: ' + pg.name + ' Succeeded');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Group \'' + pg.name + '\' successfully removed');
        response.end();
      }
      else
      {
        console.log('Removal of Group: ' + pg.name + ' Failed');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove Group\' '+ pg.name + ' \' : Group not found.');
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
    var oid = new ObjectID(pf._id);
    collection.findAndRemove({'_id':oid}, 
      function(error, result)
    {
      if(result!=null)
      {
        console.log('Removal of Family: ' + pf.name + ' Succeeded');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Family \'' + pf.name + '\' successfully removed');
        response.end();
      }
      else
      {
        collection.findAndRemove({'_id':pf._id},
          function(err, doc)
          {
            if(doc!=null)
            {
              console.log('Removal of Family: ' + pf.name + ' Succeeded');
              response.writeHead(200, {"Content-Type": "text/plain"});
              response.write('Family \'' + pf.name + '\' successfully removed');
              response.end();
            }
            else
            {
              console.log('Removal of Family: ' + pf.name + ' Failed');
              response.writeHead(200, {"Content-Type": "text/plain"});
              response.write('Failure to Remove Family\' '+ pf.name + ' \' : Family not found.');
              response.end();
            }
          }
        );
      }
    });
  }

  if(FieldQuery.action == 'change_pf')
  {
    var pf = eval('('+FieldQuery.pf+')');
    var oid = new ObjectID(pf._id);
    pf._id = oid;
    collection.save(pf);
    collection.find(pf).toArray(
      function(error, doc)
      {
        if(doc)
        {
          var string = JSON.stringify(doc[0]);
          console.log('pf: \'' + pf.name + '\' Updated');
          response.writeHead(200, {"Content-Type": "text/plain"});
          if(typeof string !== 'string')
          {
            console.log("Error: Object couldn't be converted to a string");
            response.write(FieldQuery.pf);
          }
          else
          {
            response.write(string);
          }
          response.end();
        }
        else if(error)
        {
          console.log('Failure to Update - ' + pf.name);
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('Failure to Update \' '+ pf.name + ' \' .');
          response.end();
        }
      }
    );
  }

  if(FieldQuery.action == 'update_pgf')
  {
      var doc = eval('('+FieldQuery.pgf+')');
      var s = JSON.stringify(doc);

      var oid = new ObjectID(doc._id);
      doc._id = oid;

      collection.save(doc);
      collection.find(doc).toArray(
        function(error, result)
        {
          if(error)
          {
            console.log("Error saving '"+doc.name+"' :: " + error);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write("Error saving '"+doc.name+"' :: " + error);
            response.end();
          }
          else if(result[0])
          {
            console.log("Doc '"+doc.name+"' Saved successfully");
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write("Group '"+doc.name+"' Saved successfully");
            response.end();
          }
        }
      );
  }

  if(FieldQuery.action == 'new_pf')
  {
    var pf = eval('('+FieldQuery.pf+')');

    collection.find({'type': 'pgf', 'name': pf.name}).toArray( 
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
            //if one is found, return an empty object
            //an empty object signifies nothing was added
            var s = {};
            s = JSON.stringify(s);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(s);
            response.end();
          }
          else if(result.length == 0)
          {
            collection.save(pf);
            collection.find(pf).toArray(
              function(error, doc)
              {
                if(doc)
                {
                  var string = JSON.stringify(doc[0]);
                  console.log('New pf: \'' + pf.name + '\' added');
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  if(typeof string !== 'string')
                  {
                    console.log("Error: Object couldn't be converted to a string");
                    response.write(FieldQuery.pf);
                  }
                  else
                  {
                    response.write(string);
                  }
                  response.end();
                }
                else if(error)
                {
                  console.log('New Family: Failure to Add - ' + pf.name);
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write('Failure to Add \' '+ pf.name + ' \' .');
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
          if(typeof objString !== 'string')
          {
            console.log("Error: Object couldn't be converted to a string");
            response.write('--empty--');
          }
          else
          {
            response.write(objString);
          }
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
exports.param_app = param_app;
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
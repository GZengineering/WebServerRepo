//requestHandlers.js
// This code was written by Alex Stout for Goal Zero, LLC private use

//get modules
var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable"),
    requestHelpers = require('./requestHelpers'),
    express = require('express'),
    app = express(),
    ObjectID = require('mongodb').ObjectID,
    http = require('http'),
    spawn = require('child_process').spawn,
    backup = require('./backup');

// var mongo_dir = '~/mongodb/'; //mac/linux
// var mongo_dir = 'C:/mongodb/'; //windows

var r = /^([^\\]*[\\]).*\\.*/;
r.test(process.cwd());
var root = RegExp.$1;
var mongo_dir = root+'mongodb/'; //mac/linux/windows - crossplatform


function dojo_css (response, request, collection, url)
{
  requestHelpers.return_css('../../../dojo_source_1.8.3/dojo/resources/dojo.css', response);
}


function restore(response, request, collection, url)
{
  console.log("\nRequest for 'Restore' called.");
  var fieldquery = url.parse(request.url,true).query;
  if(!fieldquery.loaded)
  {
    requestHelpers.return_html('./restore.html', response);
  }

  if(fieldquery.action == 'dump')
  {
    backup.clock(true);
    setTimeout(function(){
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('dump completed');
        response.end();   
    }, 3000);
  }

  if(fieldquery.action == 'restoreToFile')
  {
    if(eval(fieldquery.dump) == true)
    {
      console.log("DUMPING CURRENT DB");
      backup.clock(true);
      setTimeout(function()
      {
        collection.remove();
      }, 3000);
    }
    else
    {
      collection.remove();
    }
    
    setTimeout(function(){
      var f = fieldquery.filename;
      f = './dump/' + f;
      console.log('Attempting to revert database to file: ' + fieldquery.filename);

      var spawn = require('child_process').spawn,
        mongoimport = spawn(mongo_dir+'bin/mongorestore', ['--collection', 'DataBase', '--db', 'GZ', f]);

      var result;  
        
      mongoimport.stdout.on('data', function(data)
      {
        console.log(data.toString());
      });

      mongoimport.stderr.on('data', function(data)
      {
        console.log(data.toString());
        result = data.toString();
      });

      mongoimport.on('close', function(code)
      {
        console.log('Process Complete.  Exit Code: ' + code);
        if(code !== 0)
        {
          result = 'Error: exited with code' + code;
        }
        else
        {
          result = 'Database restored successfully';
        }
      });

      setTimeout(function(){
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(result);
        response.end();   
      }, 1500);
    }, 4500);
  }

  if(fieldquery.action == 'normalize')
  {
    collection.update( { "__isDirty" : { $exists : true } }, { $unset : { "__isDirty" : 1 } }, false, true);
    var c = collection.find( { "__isDirty" : { $exists : true } } ).count(true);
    
    collection.find().toArray(
      function(error, array)
      {
        if(error)
        {
          console.log(error);
          response.writeHead(200, {"Content-Type": "type/text"});
          response.write("error normalizing");
          response.end();
        }
        if(array.length > 0)
        {
          for(var i = 0; i < array.length; i++)
          {
            var item = array[i];
            var id = ''+item._id;
            id = ObjectID(id);
            collection.remove(item);
            console.log(id + ' removed');
            item._id = id;
            collection.insert(item);
            console.log(id + ' inserted');
            if(i>=array.length-1)
            {
              console.log('\ncompleted ID normalization.');
              if(c > 0)
              {
                console.log('Failed to remove __isDirty tags');
              }
              else
              {
                console.log('__isDirty tags removed');
                console.log("Normalization completed.")
              }
              response.writeHead(200, {"Content-Type": "type/text"});
              response.write("completed normalization");
              response.end();
            }
          }
        }
        else
        {
          console.log('no items found');
          response.writeHead(200, {"Content-Type": "type/text"});
          response.write("no items found");
          response.end();
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

//
function ideaBacklogEntry(response, request, collection, url)
{
    requestHelpers.return_html('./ideaBacklogEntry.html', response);
    requestHelpers.return_js('./ideaBacklogEntry.js', response);
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
}

function getVersions(response, request, collection, url)
{
  console.log('Handling request to get db restore versions');
  fs.readdir('./dump/', function(err, files)
  {
    if(err)
    {
      console.log('Error reading dump directory: ' + err);
      response.writeHead(200, {"Content-Type": "text/plain"});
      response.write('Error retrieving database dump files.');
      response.end();
    }
    else if(files)
    {
      console.log('success reading dump directory.');
      response.writeHead(200, {"Content-Type": "text/plain"});
      var s = JSON.stringify(files);
      if(s)
        response.write(s);
      else
        response.write('error converting files to string.');        
      response.end();
    }
  });
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
  if(FieldQuery.action == 'update')
  {
      var doc = JSON.parse(FieldQuery.doc);

      // var id = doc._id; //used to look for items whose ID is stored with out the ObjectId wrapper.
      var oid = ObjectID(doc._id); //used to look for items whose ID does have the ObjectId wrapper.
      delete doc._id; //delete the id from the item to avoid conflicts.
      delete doc.__isDirty;

      //try finding the item with an ID in an ObjectId wrapper
      collection.findAndModify({_id: oid},{}, doc, {safe:true},
        function(error, result)
        {
          if(result)
          {
            collection.find({_id: oid}).toArray(
              function(err, obj)
              {
                if(obj)
                {
                  var o = obj[0];
                  console.log("Doc '"+doc.name+"' Saved successfully");
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write(JSON.stringify({msg:"Item '"+doc.name+"' Saved successfully", code: 0, item: o}));
                  response.end();
                  return;
                }
                else
                {
                  console.log("Doc '"+doc.name+"' Saved successfully, but the item couldn't be returned");
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write(JSON.stringify({msg:"Item '"+doc.name+"' Saved successfully, but couldn't be returned.", code: 1}));
                  response.end();
                  return;
                }
              });
            
          }
          else
          {
            console.log("Error saving item: "+doc.name);
            response.writeHead(200, {"Content-Type": "text/plain"});
            response.write(JSON.stringify({msg:"Error saving "+doc.name, code: -1}));
            response.end();
            return;
          }
        }
      );
  }

  if(FieldQuery.action == 'new')
  {
    var doc = JSON.parse(FieldQuery.doc);

    collection.find({'type': doc.type, 'name': doc.name}).toArray( 
      function(error, result)
      {
        if(result)
        {
          if(result.length == 1)
          {
            response.writeHead(200, {"Content-Type": "text/plain"});
            var r =  JSON.stringify({msg: doc.name+" already exists.", code: 2});
            response.write(r);
            response.end();
            return;
          }
          else if(result.length == 0)
          {
            delete doc._id; //delete the id from the item to avoid conflicts.
            delete doc.__isDirty;
            collection.save(doc, {safe:true}, function(
              error, obj)
            {
                if(obj) 
                {
                  collection.find(obj).toArray(
                    function(err, array)
                    {
                      if(array)
                      {
                        var o = array[0];
                        console.log('New doc: \'' + doc.name + '\' added');
                        response.writeHead(200, {"Content-Type": "text/plain"});
                        response.write(JSON.stringify({msg: doc.name+" saved", code: 0, item: o}));
                        response.end();
                      }
                      else
                      {
                        console.log('New item: '+doc.name + "successfully added, but item couldn't be returned.");
                        response.writeHead(200, {"Content-Type": "text/plain"});
                        response.write(JSON.stringify({msg: doc.name+" saved, but couldn't return", code: 1}));
                        response.end();
                      }
                    });
                }
                else
                {
                  console.log('New Doc: Failure to Add - ' + doc.name);
                  response.writeHead(200, {"Content-Type": "text/plain"});
                  response.write(JSON.stringify({msg: doc.name+" failed to save", code: -1}));
                  response.end();
                }
            }
          );
        }
      }
      else
      {
        console.log('Error finding ' + doc.name);
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(JSON.stringify({msg: "Error finding " + doc.name, code: -1}));
        response.end();
      }
    });
  }

  if(FieldQuery.action == 'remove')
  {
    var doc = JSON.parse(FieldQuery.doc);
    var oid = ObjectID(doc._id); //used to look for items whose ID does have the ObjectId wrapper.
            delete doc._id; //delete the id from the item to avoid conflicts.
            delete doc.__isDirty;

    collection.findAndRemove({'_id':oid}, 
      function(error, result)
    {
      if(result)
      {
        console.log('Removal of Doc: ' + doc.name + ' Succeeded');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(JSON.stringify({msg:'Item \'' + doc.name + '\' successfully removed', code: 0}));
        response.end();
      }
      else
      {
        console.log('Removal of item: ' + doc.name + ' failed');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(JSON.stringify({msg:'Failure to remove item\' '+ doc.name + ' \' : Item not found.', code: -1}));
        response.end();
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
exports.dojo_css = dojo_css;
exports.favicon = favicon;
exports.specReports = specReports;
exports.family = family;
exports.global = global;
exports.getVersions = getVersions;
exports.group = group;
exports.restore = restore;
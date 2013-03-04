//requestHandlers.js

var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");

function Home(response, request, collection, url) {
  console.log("Request handler for 'Home' called.");
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

function start(response) {
  console.log("Request handler 'start' was called.");

  var body = "<html lang = 'en' style= 'background-color:#00FFFF; padding: 20px 50px 50px ALIGN:center' >" +
    '<head>'+
    "<!-- Title Bar Start -->" +
        "<h3 style='padding-bottom:20px' ALIGN = center><i>GZ Database</i> </h3>" +
        "<table border ='1' ALIGN = 'center' >" +
            "</tr><tr>" +
                "<td style ='padding: 5px 10px'><a href = '/start'>Start<a></td>" +
                "<td style ='padding: 5px 10px'><a href = '/Inventory'>Inventory Manager</a></td>" +
            "</tr>" +
        "</table>" +
        "<!-- Title Bar End -->" +
    '<h1>Upload an image file</h1>' +
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '</form>'+
    '<p>Or go to the <a href ="./Inventory"/> Inventory Form </a></p>' +
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(response, request) {
  console.log("Request handler 'upload' was called.");

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
  console.log("Request handler 'show' was called.");
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

// var UnitClassArray;
function SpecManager(response, request, collection, url) {

  console.log("Request handler 'SpecManager' was called");
  var FieldQuery = url.parse(request.url,true).query;

  if(!FieldQuery.hasOwnProperty('Event'))
  {
    fs.readFile('./SpecManager.html', function (err, html) 
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
        console.log('loading SpecManager Form');
      }
    });
  }

  if(FieldQuery.Event=='InsertUnitClass')
  {
    collection.save({'lib_id': 'SpecLib', 'UnitClass_id': FieldQuery.UnitClass_id});
    collection.ensureIndex({'UnitClass_id':1},{unique: true, sparse: true, dropDups: true});
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(FieldQuery.UnitClass_id + ' successfully added');
    response.end();
  }

  if(FieldQuery.Event=='RemoveUnitClass')
  {
    collection.findAndRemove({'lib_id':'SpecLib','UnitClass_id': FieldQuery.UnitClass_id},
      function(error, result)
    {
      if(result!=null)
      {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(FieldQuery.UnitClass_id+' successfully removed');
        response.end();
      }
      else
      {
        console.log('!--Remove failed--!');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove \' '+ FieldQuery.UnitClass_id + ' \' : Unit not found.');
        response.end();
      }
    });
  }

  if(FieldQuery.Event=='LoadUnitClassOptions')
  {
    collection.find({'lib_id':'SpecLib'}).toArray(
      function (error, UnitClasses)
      {
        if(UnitClasses.length)
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('<table width = "400px" border = "1" ALIGN = center>' +
                            '<tr>' +
                            '<td style = "background-color:#E0E0E0; width: 90px; text-align:center"> <b>Unit Classes</b>' +
                            '</td>' +
                            '</tr>');
          for(i=0;i<UnitClasses.length;i++)
          {
            response.write('<tr>' +
              '<td style = "background-color:#F0F0F0; width:90px; vertical-align:top;">' +
              UnitClasses[i].UnitClass_id +
              '</td>' +
              '</tr>'
              );

            console.log("Query results: " + UnitClasses[i].UnitClass_id + "   #" + i);
          }
          response.write('</table>');
          response.end();
          // UnitClassArray = UnitClasses;
        }
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('<table width = "400px" border = "1" ALIGN = center>' +
          '<tr>' +
          '<td style = "background-color:#E0E0E0; width: 90px; text-align: center">' +
          '<b>---  Unit List Empty ---</b>' +
          '</td>' +
          '</tr>' +
          '</table>');
          response.end();
        }
      });
  }
}

function Inventory(response, request, collection, url) {

  console.log("Request handler 'Inventory' was called");
  var FieldQuery = url.parse(request.url,true).query;

  if(!FieldQuery.hasOwnProperty('Event'))
  {
    fs.readFile('./Inventory.html', function (err, html) 
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
        console.log('loading Inventory Form');
      }
    });
  }

  if(FieldQuery.Event=='Insert')
  {
    collection.save({'lib_id': 'InventoryLib', 'sku': FieldQuery.sku, 'desc': FieldQuery.desc});
    collection.ensureIndex({'sku':1},{unique: true, sparse: true, dropDups: true});
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(FieldQuery.sku +' - ' + FieldQuery.desc + ' successfully added');
    response.end();
  }

  if(FieldQuery.Event=='Remove')
  {
    collection.findAndRemove({'lib_id':'InventoryLib','sku': FieldQuery.sku, 'desc': FieldQuery.desc},
      function(error, result)
    {
      if(result!=null)
      {
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write(FieldQuery.sku + ' - ' + FieldQuery.desc +' successfully removed');
        response.end();
      }
      else
      {
        console.log('!--Remove failed--!');
        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write('Failure to Remove \' '+ FieldQuery.sku + ' - ' + FieldQuery.desc + ' \' : Unit not found.');
        response.end();
      }
    });
  }

  if(FieldQuery.Event=='List')
  {
    collection.find({'lib_id': 'InventoryLib'}).toArray(
      function (error, doc)
      {
        if(doc.length)
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('<table width = "400px" border = "1" ALIGN = center>' +
                            '<tr>' +
                            '<td style = "background-color:#E0E0E0; width: 90px; text-align:center"> <b>SKUs</b>' +
                            '</td>' +
                            '<td style = "background-color:#E0E0E0; text-align:center"> <b>Product Description</b>' +
                            '</td>' +
                            '</tr>');
          for(i=0;i<doc.length;i++)
          {
            response.write('<tr>' +
              '<td style = "background-color:#F0F0F0; width:90px; vertical-align:top;">' +
              doc[i].sku +
              '</td>' +
              '<td style = "background-color:#F0F0F0; vertical-align:top;">' +
              doc[i].desc +
              '</td>' + 
              '</tr>'
              );

            console.log("Query results: " + doc[i].sku + " : " + doc[i].desc + "   #" + i);
          }
          response.write('</table>');
          response.end();
        }
        else
        {
          response.writeHead(200, {"Content-Type": "text/plain"});
          response.write('<table width = "400px" border = "1" ALIGN = center>' +
          '<tr>' +
          '<td style = "background-color:#E0E0E0; width: 90px; text-align: center">' +
          '<b>---  Inventory Empty ---</b>' +
          '</td>' +
          '</tr>' +
          '</table>');
          response.end();
        }
      });
  }

}

// exports.UnitClassArray = UnitClassArray; 
exports.start = start;
exports.upload = upload;
exports.show = show;
exports.Inventory = Inventory;
exports.Home = Home;
exports.SpecManager = SpecManager;
//requestHandlers.js

//import modules
var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");

/**
* Start page request.  The page is constructed programmatically.
* This page won't exist 
*/
function start(response) {
  console.log("Request handler 'start' was called.");

  var body = '<html>'+
    '<head>'+
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
    '<p>Or go to the <a href ="./form"/> Form </a></p>' +
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

function form(response, request, collection, url) {

  console.log("Request handler 'form' was called");
  var FieldQuery = url.parse(request.url,true).query;

  if(!FieldQuery.hasOwnProperty('Event'))
  {
    fs.readFile('./form1.html', function (err, html) 
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
        console.log('loading form');
      }
    });
  }

  if(FieldQuery.Event=='Insert')
  {
    collection.insert({'sku': FieldQuery.sku, 'desc':FieldQuery.desc});
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(FieldQuery.sku +' - ' + FieldQuery.desc + ' successfully added');
    response.end();
  }

  if(FieldQuery.Event=='Remove')
  {
    collection.findAndRemove({'sku': FieldQuery.sku, 'desc': FieldQuery.desc},
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
    collection.find().toArray(
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

            console.log("find() results: " + doc[i].sku + " : " + doc[i].desc + "   #" + i);
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

exports.start = start;
exports.upload = upload;
exports.show = show;
exports.form = form;
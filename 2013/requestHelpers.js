//requestHelpers.js
// This code was written by Alex Stout for Goal Zero, LLC private use.
//April 2013

var fs = require("fs");

function return_html(page, response) 
{
  fs.readFile(page, function (err, html) 
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
      }
    });
} 

function return_js(file, response) 
{
  fs.readFile(file, function (err, js) 
    {
      if(err)
      {
       response.writeHead(404, {"Content-Type": "text/html"});
       response.write(err + "\n");
       response.end();
      }
      else 
      {
        response.writeHead(200, {"Content-Type": "text/javascript"});       
        response.write(js);
        response.end();
      }
    });
}

function return_bson(file, response) 
{
  fs.readFile(file, function (err, bson) 
    {
      if(err)
      {
       response.writeHead(404, {"Content-Type": "text/html"});
       response.write(err + "\n");
       response.end();
      }
      else 
      {
        response.writeHead(200, {"Content-Type": "file/bson", "Content-Disposition": "inline; filename=DataBase.bson"});       
        response.write(bson);
        response.end();
      }
    });
}

function return_css(file, response) 
{
  fs.readFile(file, function (err, css) 
    {
      if(err)
      {
       response.writeHead(404, {"Content-Type": "text/html"});
       response.write(err + "\n");
       response.end();
      }
      else 
      {
        response.writeHead(200, {"Content-Type": "text/css"});       
        response.write(css);
        response.end();
      }
    });
}

function return_img(file, response) 
{
  fs.readFile(file, function (err, img) 
    {
      if(err)
      {
       response.writeHead(404, {"Content-Type": "text/html"});
       response.write(err);
       response.end();
      }
      else 
      {
        response.writeHead(200, {"Content-Type": "image/jpeg"});       
        response.write(img);
        response.end();
      }
    });
}


exports.return_html = return_html;
exports.return_img = return_img;
exports.return_bson = return_bson;
exports.return_js = return_js;    
exports.return_css = return_css;    
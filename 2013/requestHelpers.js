//requestHelpers.js
// This code was written by Alex Stout for Goal Zero, LLC private
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


exports.return_html = return_html;
exports.return_js = return_js;    
//requestHelpers.js
 var fs = require("fs");

function return_html(page, response) {
  fs.readFile(page, function (err, html) 
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
        console.log('loading parameter Form');
        response.end();
      }
    });
    }

exports.return_html = return_html;    
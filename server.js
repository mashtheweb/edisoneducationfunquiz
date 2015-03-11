/*
    web_button.js
    Part of "Intel IoT Edison web controlled LED demo"
    Copyright 2014 Pavlos Iliopoulos, techprolet.com
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var http = require('http');
var url = require('url');
var fs = require('fs');

////////////////////////////////////////////////////////////////////////////////////////////////

var http = require('http');
var fs = require('fs');

var randomword = "dummy"
var witeToFile = function(fileName, text) {

    fs.writeFile("/tmp/" + fileName, text, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("The " + fileName + " file was saved!");
        }
    });
}


callback = function(response) {
    var data = '';

    response.on('data', function(chunk) {
        data += chunk;
    });

    response.on('end', function() {
        data = JSON.parse(data);
        if (data.length > 0) {

            console.log(data[0].question);
            console.log(data[0].answer);
            console.log(randomword)
            witeToFile('quiz.txt', data[0].question + '\r\na. ' + data[0].answer + '\r\nb. ' + randomword)

        } else {
            console.log("got no questions")
        }
    });
}


var getQuestion = function() {
	http.request('http://randomword.setgetgo.com/get.php', function (resp) {
		var data = '';
	    resp.on('data', function(chunk) {
	        data += chunk;
	    });

	    resp.on('end', function() {
	    	randomword = data;
    		http.request('http://jservice.io/api/random', callback).end();

	    });
	}).end();
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var arduinoFileName = "/tmp/arduino.txt";

function sendResponse(ledOn, remoteIP, response) {
    
    if (remoteIP != null){
         console.log('\nRequest to switch LED ' + (ledOn?'On':'Off'));
         console.log('from ' + remoteIP);
         var fileStream = fs.createWriteStream(arduinoFileName);
         fileStream.write(ledOn + "\n" + remoteIP + "\nOK\n");
         fileStream.end();
         
         response.writeHead(302, {
               'Location': '/'
         });
         response.end();
    } else {
     response.writeHead(200, { 'Content-Type': 'text/html' });
     response.write('<!DOCTYPE html><html lang="en"><head>');
     response.write('<meta charset="utf-8">'); 
     response.write('<meta http-equiv="refresh" content="30" />');
     response.write('<title>Edison Education</title>');
     if (!ledOn) {
      response.write ('<style>body{background-color:black;color:white;}</style>'); 
     }
     response.write('</head>');
     
response.write('<body><h1>Answer locker '+(ledOn?'On':'Off'));
         
     response.write('</h1>');
     if (ledOn){
      response.write('<a href="/off">Stop!</a>');
     } else {
      response.write('<a href="/on">Start!</a>');
     }
     
response.write('</body></html>');

     response.end();
    }
}

function processRequest(request, response) {
    "use strict";
    var pathName = url.parse(request.url).pathname;  
    var remoteIP = request.headers['X-Forwarded-For'] == undefined?request.connection.remoteAddress:request.headers['X-Forwarded-For'];

 if (pathName == "/on") {
     sendResponse (true, remoteIP, response);
    } else if (pathName == "/off") {
     sendResponse (false, remoteIP, response);
    } else if (pathName == "/") {
        getQuestion();////
     fs.exists(arduinoFileName, function (exists) {
         if (exists){
          fs.readFile(arduinoFileName, function(err,data){
              if (!err){
               console.log('\nStored data:\n' + data);
               var storedData = data.toString().split("\n");
       	sendResponse ((storedData[0] == "true"), null, response);
              }else{
               console.log(err);
              }
          });
         } else {
            sendResponse (false, null, response);
         }
      });
    } else {
      response.end();
    }
}

http.createServer(processRequest).listen(8080);

console.log("Server running at port 8080");

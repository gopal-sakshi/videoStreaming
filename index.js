const express = require('express');
const bodyParser= require('body-parser');
const fs = require('fs');
var http = require('http');

const app = express();

var PORT = process.env.PORT || process.argv[2] || 3039;
app.set('port', PORT);
var serverInstance = http.createServer(app);
serverInstance.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});

app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9999');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,range');
    res.setHeader('Access-Control-Allow-Credentials', true);  
    next(); 
})
app.get('/videos/:videoId', (req, res) => {
    var videoId = req.params.videoId
    console.log(`you requested ${videoId}`);
    
    // range must be sent from client side... it indicates what part of the video you want to send back
    const range = req.headers.range;
    if (!range) {
        console.log('set the range');
        // res.status(400).send("Requires Range header");
    }

    // videoPath & videoSize
    const videoPath = `/resources/${videoId}.webm`;
    const videoSize = fs.statSync(__dirname+`${videoPath}`).size;
    console.log(videoPath);
    console.log(videoSize);

    const CHUNK_SIZE = 10 ** 6; // 1MB              // it seems ** -------> is powerOf ????
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;

    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/webm",        
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(__dirname+`${videoPath}`, { start, end });
    videoStream.pipe(res);
});

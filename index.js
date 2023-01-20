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
        res.status(400).send("Requires Range header");
    }

    var videoDetails = fetchVideo(videoId, range);

    const headers = {
        "Content-Range": `bytes ${videoDetails.start}-${videoDetails.end}/${videoDetails.videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": videoDetails.contentLength,
        "Content-Type": `video/${videoDetails.videoExtension}`,
    };
    res.writeHead(206, headers);
    const videoStart = videoDetails.start;
    const videoEnd = videoDetails.end;
    const videoStream = fs.createReadStream(__dirname+`${videoDetails.videoPath}`, { videoStart, videoEnd });
    videoStream.pipe(res);
});

function fetchVideo(videoId, range) {
    // videoPath & videoSize
    var videoExtension = getVideoExtension();
    const videoPath = `/resources2/${videoId}.${videoExtension}`;
    const videoSize = fs.statSync(__dirname+`${videoPath}`).size;
    console.log(videoPath);
    console.log(videoSize);

    const CHUNK_SIZE = 100 ** 6; // 1MB              // it seems ** -------> is powerOf ????
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    return {
        videoPath: videoPath,
        videoSize: videoSize,
        start: start,
        end: end,
        contentLength: contentLength,
        videoExtension: videoExtension
    }
}

function getVideoExtension() {
    return 'mp4';
}
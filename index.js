const express = require('express');
const axios = require('axios');
const yts = require('yt-search');
const path = require("path");

const app = express();
const port = 3000;

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/cliff/🖕.html"));
});

app.get('/yt-audio', async (req, res) => {
    const searchQuery = req.query.search;

    if (!searchQuery) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const videoSearchUrl = `https://betadash-search-download.vercel.app/yt?search={searchQuery}`;

        const videoResponse = await axios.get(videoSearchUrl);
        const videoData = videoResponse.data[0];

        if (!videoData) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const videoUrl = videoData.url;
        const videoId = new URL(videoUrl).searchParams.get('v');

        const video = await yts({ videoId });
        const result = {
            url: `https://youtu.be/${videoId}?si=wLIhI3mr1YV0gl9L`
        };

        const downloadUrl = `https://ccprojectsjonellapis-production.up.railway.app/api/music?url=${result.url}`;

        const downloadResponse = await axios.get(downloadUrl);
        const downloadResult = downloadResponse.data.data;

        const videoResult = {
            title: downloadResult.title,
            downloadUrl: downloadResult.link,
            time: videoData.time,
            views: videoData.views,
            duration: downloadResult.duration,
            filesize: downloadResult.filesize,
            channelName: videoData.channelName
        };

        res.json(videoResult);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching video or download URL' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

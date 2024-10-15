const express = require('express');
const axios = require('axios');
const yts = require('yt-search');

const app = express();
const port = 3000;

app.get('/video', async (req, res) => {
    const searchQuery = req.query.search;

    if (!searchQuery) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const videoSearchUrl = `https://api-nako-choru-production.up.railway.app/yt?search=${searchQuery}&limit=1`;

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

        const downloadUrl = `https://betadash-api-swordslush.vercel.app/ytdl?url=${result.url}`;

        const downloadResponse = await axios.get(downloadUrl);
        const downloadResult = downloadResponse.data.data;

        const videoResult = {
            title: downloadResult.title,
            downloadUrl: downloadResult.video,
            time: videoData.time,
            views: videoData.views,
            audio: downloadResult.audio,
            quality: downloadResult.quality,
            channelName: videoData.channelName
        };

        res.json(videoResult);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching video or download URL' });
    }
});

const { ytdown } = require("nayan-media-downloader");

app.get('/ytdl', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).send({"Error": "Missing 'url' query parameter"});
    }

    try {
        const response = await ytdown(videoUrl);

        delete response.developer;
        delete response.devfb;
        delete response.devwp;

        res.json(response);
    } catch (error) {
        res.status(500).send("Error downloading video");
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
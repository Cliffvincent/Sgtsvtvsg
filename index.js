const express = require('express');
const axios = require('axios');
const yts = require('yt-search');
const path = require("path");

const app = express();
const port = 3000;

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/cliff/🖕.html"));
});

const base64Decode = (str) => Buffer.from(str, 'base64').toString('utf8');
const encodedToken = "YWNjZXNzIG9ubHkgYnkgQ2hvcnUgVGlrdG9rZXJz";
const encodedCookies = "c2VydmVyPW5leHRnZW4mYWRtaW49Q2hvcnU=";
const encodedEmail = "dXNlcmNob3J1QGdtYWlsLmNvbQ==";
const token = base64Decode(encodedToken);
const cookies = base64Decode(encodedCookies);
const email = base64Decode(encodedEmail);

function extractJsonFromHtml(html) {
  const jsonMatch = html.match(/var ytInitialData = ({.*?});/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (error) {
      console.error("Error parsing JSON data:", error.message || "Unknown error");
      return null;
    }
  }
  return null;
}


function extractRelevantDatas(jsonData, limit) {
  const items = [];
  let count = 0;

  const traverse = (obj) => {
    if (count >= limit) return;
    if (obj && typeof obj === 'object') {
      if (obj.hasOwnProperty('videoRenderer')) {
        const renderer = obj.videoRenderer;
        const title = renderer.title?.runs?.[0]?.text || 'No Title';
        const time = renderer.lengthText?.simpleText || 'No Time';
        const thumbnail = renderer.thumbnail?.thumbnails?.[0]?.url || 'No Thumbnail';
        const videoId = renderer.videoId || 'No Video ID';
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const views = renderer.shortViewCountText?.simpleText || 'No Views';
        const channelName = renderer.ownerText?.runs?.[0]?.text || 'No Channel Name';
        items.push({ title, time, thumbnail, url, views, channelName });
        count++;
      } else {
        for (const key in obj) {
          traverse(obj[key]);
        }
      }
    }
  };

  traverse(jsonData);
  return items;
}


app.get('/yt', async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(search)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const jsonData = extractJsonFromHtml(response.data);
    const results = extractRelevantDatas(jsonData, req.query.limit || 1); 
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error performing YouTube search: ' + error.message });
  }
});

app.get('/yt-audio', async (req, res) => {
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
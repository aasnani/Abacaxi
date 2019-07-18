const Video = require("../../models/Video");
const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    Video.countDocuments().then(count => {
        if(count == 0){
            res.json(constructResponse(true,`There are no trending videos!`, {videos: [], count:count}));
            return;
        }
        Video.find().then(documents => {
            let videoArray = convertDocArrayToVideoArray(documents);
            videoArray = sortVideos(videoArray, false);
            res.json(constructResponse(true,`Successfully found top 3 trending videos!`, {videos: videoArray, count: videoArray.length}));
        })
    }).catch(err => {
        console.log(`Error in parsing GET request to /api/videos/trending: ${err}`);
        res.json(constructResponse(false, `There was an error with retrieving the trending videos. Sorry!`, {videos: [], count: -1}));
    })
});


const convertDocArrayToVideoArray = docsarray => {
    let vidarray = [];
    docsarray.forEach(doc => {
      vidarray.push({
        wikiPageId: doc.get("wikiPageId", Number),
        sectionIdx: doc.get("sectionIdx", Number),
        ytId: doc.get("ytId", String),
        title: doc.get("title", String),
        upvotes: doc.get("upvotes", Number),
        downvotes: doc.get("downvotes", Number)
      });
    });
    return sortVideos(vidarray, true);
  };

const sortVideos = (videos, applyFilter) => {
    let sortedVideos = [];

    const getSectionIds = videos => {
        let sectionIDSet = new Set();
        videos.forEach(video => {
            sectionIDSet.add(video["sectionIdx"]);
        });
        return Array.from(sectionIDSet);
    };

    const compareVideos = (v1, v2) => {
        let v1Score = v1["upvotes"] - v1["downvotes"];
        let v2Score = v2["upvotes"] - v2["downvotes"];
        return v1Score - v2Score;
    };

    if (applyFilter) {
        let sectionIDList = getSectionIds(videos);
        sectionIDList.forEach(sectionID => {
            let sectionVideos = videos.filter(
                video => video["sectionIdx"] === sectionID
            );
            let sortedSectionVideos = sectionVideos.sort(compareVideos).reverse();
            sortedVideos = sortedVideos.concat(sortedSectionVideos);
        });
    } else
        sortedVideos = videos
        .sort(compareVideos)
        .reverse()
        .slice(0, 3);

    return sortedVideos;
};

const reconstructVideo = (dbVideo) => {
    let reconstructedVideo = {
        wikiPageId: dbVideo.wikiPageId,
        sectionIdx: dbVideo.sectionIdx,
        ytId: dbVideo.ytId, //reconstructing it to send using response body,
        title: dbVideo.title,
        upvotes: dbVideo.upvotes,
        downvotes: dbVideo.downvotes
    };
    return reconstructedVideo;
};

const constructResponse = (success, message, optionals) => {
    let responseObject = {
      success: success,
      msg: message
    };
    Object.keys(optionals).forEach(key => {
      responseObject[key] = optionals[key];
    });
    return responseObject;
  };

  module.exports = router;
const express = require("express");
const router = express.Router();
const url = require('url'); //url module to construct URL using specified params
const URLSearchParams = url.URLSearchParams;
const URL = url.URL;
const fetch = require('node-fetch'); //fetch API module for node.js(apparently doesn't automatically support it?)

//Video Model
const Video = require("../../models/Video");

router.get("/:id", (req, res) => {
  let wikiId = parseInt(req.params.id, 10);
  let videoArray = [];
  Video.countDocuments({
      wikiPageId: wikiId
    })
    .then((err, count) => {
      if (count == 0)
        res.json(
          constructResponse(true, `No videos for wikiPage: ${wikiId} found!`, {
            videos: [],
            count: count
          })
        );
      else
        Video.find({
          wikiPageId: parseInt(req.params.id, 10)
        }).then(documents => {
          videoArray = convertDocArrayToVideoArray(documents);
          res.json(
            constructResponse(
              true,
              `Successfully found list of videos for Wiki Page with id: ${wikiId}`, {
                videos: videoArray,
                count: videoArray.length
              }
            )
          );
        });
    })
    .catch(error => {
      console.log(
        `Error in parsing GET request to /api/videos/${wikiId}: ${error}`
      );
      res.json(
        constructResponse(
          false,
          `There was an error with retrieving the videos for this page. Sorry!`, {
            videos: [],
            count: -1
          }
        )
      );
    });
});

router.post("/", (req, res) => {
  let newVideo = req.body.video;

  Video.find({
    wikiPageId: newVideo.wikiPageId,
    sectionIdx: newVideo.sectionIdx,
    ytId: newVideo.ytId
  }).countDocuments().then(async (count) => {
    console.log(count);
    if (count == 0) {
      let videoTitle = await fetchTitle(newVideo.ytId);
      let videoToBeInserted = new Video({
        title: videoTitle,
        sectionIdx: newVideo.sectionIdx,
        wikiPageId: newVideo.wikiPageId,
        ytId: newVideo.ytId
      });

      videoToBeInserted.save().then(video => {
        console.log(`Video with ID: ${video.ytId} and wikipage ID: ${video.wikiPageId} successfully added to database!`);
        res.json(constructResponse(true, `Video '${video.title}' successfully submitted!`, {
          video: reconstructVideo(video)
        }))
      })
    } else res.json(constructResponse(false, "This video for this specific page, topic and subsection already exists!", {video:{}}));

  }).catch(err => {
    console.log(`Error in adding video with ID: ${newVideo.ytId} and wikipage ID: ${newVideo.wikiPageId}: ${err}`);
    res.json(constructResponse(false, `There was an error inserting/retrieving the video you submitted from the database!`, {
      video: {}
    }));
  });

})

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


const fetchTitle = async (id) => {
  let ytApiSearchParams = new URLSearchParams(ytApiUrl.search);
  ytApiSearchParams.append("key", ytApiKey);
  ytApiSearchParams.append("part", "snippet"); //Constructing specific endpoint URL for specific video we need to hit
  ytApiSearchParams.append("id", id); //Example: https://www.googleapis.com/youtube/v3/videos?part=snippet&id=3MtrUf81k6c&key=AIzaSyCCnoDp8ullFubmLqfEJdbs5EmmQ37mu2s
  let title = await fetch(ytApiUrl + ytApiSearchParams.toString(), ytApiParams).then(data => {
    return data.json()
  }).then(response => {
    if (response.pageInfo.totalResults == 0 || response.pageInfo.resultsPerPage == 0) return null;
    else return response.items[0].snippet.title;
  });
  return title;
}; //Using the URL module 


const ytApiParams = {
  method: "GET",
  headers: {
    Accept: 'application/json'
  },
}; //constant parameters for the ytapi, including the method and what type of response we accept(see yt api docs)

const ytApiKey = "AIzaSyCCnoDp8ullFubmLqfEJdbs5EmmQ37mu2s"; //hardcoded auth key for YT API I made

const ytApiUrl = new URL("https://www.googleapis.com/youtube/v3/videos?"); //specific endpoint we need to hit for youtube video data

module.exports = router;
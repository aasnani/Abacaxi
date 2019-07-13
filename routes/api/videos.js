const express = require("express");
const router = express.Router();

//Video Model
const Video = require("../../models/Video");

router.get("/:id", (req, res) => {
  console.log("HI");
  let videoArray = [];
  Video.count({
    wikiPageId: parseInt(req.params.id,10)
  }).then((err,count) => {
    console.log(count);
    if(count == 0) res.json(constructResponse(true,`No videos for wikiPage: ${parseInt(req.params.id,10)} found!`, {videos: [], count:count}));
    else Video.find({
      wikiPageId: parseInt(req.params.id,10)
    }).then(documents => {
      videoArray = convertDocArrayToVideoArray(documents);
      res.json(constructResponse(true,`Successfully found list of videos for Wiki Page with id: ${parseInt(req.params.id,10)}`, {videos: videoArray, count: videoArray.length}));
    })
  }).catch(error => {
    console.log(`Error in parsing GET request to /api/videos/${parseInt(req.params.id,10)}: ${error}`);
    res.json(constructResponse(false, `There was an error with retrieving the videos for this page. Sorry!`, {videos: [], count: -1}));
  });
});


const constructResponse = (success, message, optionals) => {
    let responseObject = {
      success: success,
      msg: message
    };
    Object.keys(optionals).forEach(key => {
      responseObject[key] = optionals[key];
    })
    return responseObject;
  };

const convertDocArrayToVideoArray = (docsarray) => {
  let vidarray = [];
  docsarray.forEach(doc => {
    vidarray.push({
      wikiPageId: doc.get('wikiPageId', Number),
      sectionIdx: doc.get('sectionIdx', Number),
      ytId: doc.get('ytId', String),
      title: doc.get('title', String),
      upvotes: doc.get('upvotes', Number),
      downvotes: doc.get('downvotes', Number)
    })
  });
  return sortVideos(vidarray,true);
};

const sortVideos = (videos,applyFilter) => {
  let sortedVideos = [];
  if(applyFilter){
    let sectionIDList = getSectionIds(videos);
    sectionIDList.forEach(sectionID => {
      let sectionVideos = videos.filter(video => video["sectionIdx"] === sectionID);
      let sortedSectionVideos = sectionVideos.sort(compareVideos).reverse();
      sortedVideos = sortedVideos.concat(sortedSectionVideos);
    });
  }
  else sortedVideos = videos.sort(compareVideos).reverse().slice(0,3);

  return sortedVideos;
}

// const reconstructVideo = (dbVideo) => {
//   let reconstructedVideo = {
//     wikiPageId: dbVideo.wikiPageId,
//     sectionIdx: dbVideo.sectionIdx,
//     ytId: dbVideo.ytId, //reconstructing it to send using response body,
//     title: dbVideo.title,
//     upvotes: dbVideo.upvotes,
//     downvotes: dbVideo.downvotes
//   };
//   return reconstructedVideo;
// };

module.exports = router;
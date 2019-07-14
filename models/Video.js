const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const videoSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: new Date(),
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    sectionIdx: {
        type: Number,
        required: true
    },
    wikiPageId: {
        type: Number,
        required: true
    },
    ytId: {
        type: String,
        required: true
    }
});

const Video = mongoose.model("video",videoSchema, "videos");

module.exports = Video;
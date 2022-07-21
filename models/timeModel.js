const mongoose = require("mongoose");

const timeSchema = new mongoose.Schema({
  time: { type: Number },
});

const time = mongoose.model("time", timeSchema);

module.exports = time;

const mongoose = require("mongoose");

const ttimeSchema = new mongoose.Schema({
  startorstop: { type: Boolean },
  type: { type: String },
  when: { type: Date },
});

const ttime = mongoose.model("ttime", ttimeSchema);

module.exports = ttime;

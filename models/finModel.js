const mongoose = require("mongoose");

const finSchema = new mongoose.Schema(
  {
    number: Number,
    isOneTime: Boolean,
    oneTimeDate: Date,
    recTimePer: String,
    reqTimeDay: Number,
    depatments: String,
    more: String,
    invoice: string,
  },
  {
    timestamps: true,
  }
);

const fin = mongoose.model("fin", finSchema);

module.exports = fin;

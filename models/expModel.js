const mongoose = require("mongoose");

const expSchema = new mongoose.Schema(
  {
    amount: Number,
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

const exp = mongoose.model("fin", expSchema);

module.exports = exp;

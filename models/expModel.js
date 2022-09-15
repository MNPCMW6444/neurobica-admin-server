const mongoose = require("mongoose");

const expSchema = new mongoose.Schema(
  {
    amount: Number,
    isOneTime: Boolean,
    oneTimeDate: Date,
    monthly: Boolean,
    reqTimeDay: Number,
    reqTimeMonth: Number,
    department: String,
    more: String,
    invoice: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const exp = mongoose.model("fin", expSchema);

module.exports = exp;

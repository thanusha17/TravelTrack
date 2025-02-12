const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
  name: { type: String, required: true },
  expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }],
});

module.exports = mongoose.model("Category", categorySchema);
const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  trips: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trip" }],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
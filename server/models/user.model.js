const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('User', userSchema);

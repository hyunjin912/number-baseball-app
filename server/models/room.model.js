const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  roomName: String,
  roomNumber: String,
  usersInTheRoom: [
    {
      nickname: String,
      ready: {
        type: Boolean,
        default: false,
      },
      team: String,
      settingNumber: String,
    },
  ],
  messages: [
    {
      type: {
        type: String,
      },
      nickname: String,
      team: String,
      msg: String,
    },
  ],
});

module.exports = mongoose.model('Room', roomSchema);

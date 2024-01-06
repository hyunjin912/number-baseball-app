const roomModel = require('../models/room.model');

// author: {
//     type: mongoose.Schema.ObjectId,
//     ref: 'User',
//   },
//   roomName: String,
//   roomNumber: String,
//   usersInTheRoom: [String],
// });

const roomController = {
  saveRoom: async (room) => {
    let newRoom = await roomModel.findOne({ roomNumber: room.roomNumber });
    if (!newRoom) {
      newRoom = new roomModel({
        author: room.author,
        roomName: room.roomName,
        roomNumber: room.roomNumber,
        usersInTheRoom: room.usersInTheRoom,
        messages: room.messages,
      });
      await newRoom.save();
    }

    return newRoom;
  },

  updateRoom: async (condition, update) => {
    const room = await roomModel.findOneAndUpdate(condition, update, {
      new: true,
    });
    return room;
  },

  getRooms: async () => {
    const rooms = await roomModel.find({}).populate('author');
    return rooms;
  },

  getRoom: async (roomNumber) => {
    const room = await roomModel.findOne({ roomNumber }).populate('author');
    return room;
  },

  getRoomByUser: async (nickname) => {
    // const room = await roomModel
    //   .findOne({
    //     usersInTheRoom: { nickname },
    //   })
    //   .populate('author');
    const room = await roomModel
      .findOne({
        usersInTheRoom: {
          $elemMatch: { nickname },
        },
      })
      .populate('author');
    return room;
  },

  deleteRoom: async (roomNumber) => {
    const room = await roomModel.deleteOne({ roomNumber });
    return room;
  },

  deleteAll: async () => {
    await roomModel.deleteMany({});
  },
};
module.exports = roomController;

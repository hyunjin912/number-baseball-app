if (process.env.NODE_ENV === 'production') {
  const roomModel = require('../models/room.model');

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
} else {
  const rooms = [];

  class Room {
    constructor({ author, roomName, roomNumber, usersInTheRoom, messages }) {
      this.author = author;
      this.roomName = roomName;
      this.roomNumber = roomNumber;
      this.usersInTheRoom = usersInTheRoom;
      this.messages = messages;
    }

    async save() {
      return this;
    }
  }

  const roomController = {
    saveRoom: async (room) => {
      let newRoom = rooms.find(
        (originRoom) => originRoom.roomNumber === room.roomNumber,
      );
      if (!newRoom) {
        newRoom = new Room(room);
        rooms.push(newRoom);
      }

      return newRoom;
    },

    getRooms: async () => {
      return rooms;
    },

    getRoom: async (roomNumber) => {
      const room = rooms.find((room) => room.roomNumber === roomNumber);
      return room;
    },

    getRoomByUser: async (nickname) => {
      const room = rooms.find((room) =>
        room.usersInTheRoom.find((user) => user.nickname === nickname),
      );
      return room;
    },

    deleteRoom: async (roomNumber) => {
      const idx = rooms.findIndex((room) => room.roomNumber === roomNumber);
      return rooms.splice(idx, 1);
    },

    deleteAll: async () => {
      rooms.splice(0, rooms.length);
    },
  };

  module.exports = roomController;
}

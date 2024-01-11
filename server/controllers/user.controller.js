if (process.env.NODE_ENV === 'production') {
  const userModel = require('../models/user.model');

  const userController = {
    saveUser: async ({ nickname, token }) => {
      let user = await userModel.findOne({ nickname });
      if (!user) {
        user = new userModel({
          nickname,
          token,
        });

        await user.save();
        return user;
      } else {
        throw Error('이미 존재하는 닉네임입니다');
      }
    },

    updateUser: async (condition, update) => {
      const user = await userModel.findOneAndUpdate(condition, update, {
        new: true,
      });
      return user;
    },

    getUsers: async () => {
      const users = await userModel.find({ isOnline: true });
      return users;
    },

    getUser: async (token) => {
      const user = await userModel.findOne({ token });
      return user;
    },

    deleteUser: async (token) => {
      const user = await userModel.deleteOne({ token });
      return user;
    },

    deleteAll: async () => {
      await userModel.deleteMany({});
    },
  };

  module.exports = userController;
} else {
  const users = [];

  class User {
    constructor({ nickname, token }) {
      this.nickname = nickname;
      this.token = token;
      this.isOnline = true;
    }

    async save() {
      return this;
    }
  }

  const userController = {
    saveUser: async ({ nickname, token }) => {
      let user = users.find((user) => user.nickname === nickname);
      if (!user) {
        user = new User({
          nickname,
          token,
        });
        users.push(user);

        return user;
      } else {
        throw Error('이미 존재하는 닉네임입니다');
      }
    },

    updateUser: async (condition, update) => {
      const user = users.find((user) => user.nickname === condition.nickname);
      user.token = update.token;
      return user;
    },

    getUsers: async () => {
      return users;
    },

    getUser: async (token) => {
      const user = users.find((user) => user.token === token);
      return user;
    },

    deleteUser: async (token) => {
      const idx = users.findIndex((user) => user.token === token);
      return users.splice(idx, 1);
    },

    deleteAll: async () => {
      users.splice(0, users.length);
    },
  };

  module.exports = userController;
}

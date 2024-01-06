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
    // online 유저만 반환
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

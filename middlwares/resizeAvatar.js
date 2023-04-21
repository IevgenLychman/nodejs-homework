const Jimp = require("jimp");

const resizeAvatar = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  image.autocrop().contain(250, 250).writeAsync(imagePath);
};

module.exports = resizeAvatar;

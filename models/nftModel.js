const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  itemTitle: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  royalties: { type: Number, required: true },
  picture: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const NFT = mongoose.model('NFT', nftSchema);

module.exports = NFT;

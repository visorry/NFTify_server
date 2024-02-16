const express = require('express');
const multer = require('multer');
const router = express.Router();
const NFT = require('../models/nftModel');
const auth = require('../middlewares/authMiddleware');
const upload = multer({ dest: 'uploads' });
const User = require('../models/userModel')
router.post('/nfts', auth, upload.single('picture'), async (req, res) => {
  try {
    const nft = new NFT({
      ...req.body,
      picture: req.file.filename,
      creator: req.userId,
    });

    await nft.save();
    res.status(201).send(nft);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'uploads', filename + '.jpg'); // Assuming ".jpg" extension

  // Set content type to image/jpeg
  res.type('image/jpeg');

  // Send the file
  res.sendFile(imagePath);
});


router.get('/my-nfts', auth, async (req, res) => {
  try {
    const userNFTs = await NFT.find({ creator: req.userId });

    res.json(userNFTs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/nfts', auth, async (req, res) => {
  try {
    const nfts = await NFT.find();
    res.send(nfts);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/nfts/:id', auth, async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);
    if (!nft) {
      return res.status(404).send();
    }
    res.send(nft);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.patch('/nfts/:id', auth, async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    const user = await User.findById(req.userId);

    // Check if the user is the creator
    if (!user || (nft.creator.toString() !== req.userId)) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const updatedNFT = await NFT.findByIdAndUpdate(req.params.id, req.body);

    if (!updatedNFT) {
      return res.status(404).json({ message: 'NFT not found' });
    }
    const newNFT = await NFT.findById(req.params.id);
    res.json(newNFT);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete NFT
router.delete('/nfts/:id', auth, async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    const user = await User.findById(req.userId);

    // Check if the user is the creator or has admin role
    if (!user || (nft.creator.toString() !== req.userId && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const deletedNFT = await NFT.findByIdAndDelete(req.params.id);

    if (!deletedNFT) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    res.json(deletedNFT);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;

const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const NFT = require('../models/nftModel');
const auth = require('../middlewares/authMiddleware');
const User = require('../models/userModel')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './routes/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: NFTs
 *   description: Operations related to NFTs
 */

/**
 * @swagger
 * /nfts:
 *   post:
 *     summary: Create a new NFT
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: picture
 *         type: file
 *         description: The picture file for the NFT
 *       - in: body
 *         name: body
 *         description: NFT data
 *         required: true
 *         schema:
 *           $ref: '#/definitions/NFT'
 *     responses:
 *       201:
 *         description: NFT created successfully
 *         schema:
 *           $ref: '#/definitions/NFT'
 *       400:
 *         description: Bad request, check your request body
 */
router.post('/nfts', auth, upload.single('picture'), async (req, res) => {
  try {
    const nft = new NFT({
      ...req.body,
      picture: req.file.originalname, // Use the original filename with extension
      creator: req.userId,
    });

    await nft.save();
    res.status(201).send(nft);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * @swagger
 * /uploads/{filename}:
 *   get:
 *     summary: Get the image associated with an NFT
 *     tags: [NFTs]
 *     parameters:
 *       - in: path
 *         name: filename
 *         type: string
 *         required: true
 *         description: The filename of the image
 *     responses:
 *       200:
 *         description: The image file
 *       500:
 *         description: Internal server error
 */
// Route to serve images with proper extension and content type
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;

  // Set content type to image/jpeg
  res.type('image/jpeg');

  // Send the file
  res.sendFile(path.join(__dirname, 'uploads', filename + '.jpg'));
});

/**
 * @swagger
 * /my-nfts:
 *   get:
 *     summary: Get NFTs created by the authenticated user
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: An array of NFTs created by the user
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/NFT'
 *       500:
 *         description: Internal server error
 */
router.get('/my-nfts', auth, async (req, res) => {
  try {
    const userNFTs = await NFT.find({ creator: req.userId });

    res.json(userNFTs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
/**
 * @swagger
 * /nfts:
 *   get:
 *     summary: Get all NFTs
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: An array of NFTs
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/NFT'
 *       500:
 *         description: Internal server error
 */

router.get('/nfts', auth, async (req, res) => {
  try {
    const nfts = await NFT.find();
    res.send(nfts);
  } catch (error) {
    res.status(500).send(error);
  }
});


/**
 * @swagger
 * /nfts/{id}:
 *   get:
 *     summary: Get a specific NFT by ID
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         type: string
 *         required: true
 *         description: The ID of the NFT to retrieve
 *     responses:
 *       200:
 *         description: The requested NFT
 *         schema:
 *           $ref: '#/definitions/NFT'
 *       404:
 *         description: NFT not found
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /nfts/{id}:
 *   patch:
 *     summary: Update a specific NFT by ID
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         type: string
 *         required: true
 *         description: The ID of the NFT to update
 *       - in: formData
 *         name: picture
 *         type: file
 *         description: The updated picture file for the NFT
 *       - in: body
 *         name: body
 *         description: Updated NFT data
 *         required: true
 *         schema:
 *           $ref: '#/definitions/NFT'
 *     responses:
 *       200:
 *         description: The updated NFT
 *         schema:
 *           $ref: '#/definitions/NFT'
 *       404:
 *         description: NFT not found
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Internal server error
 */
router.patch('/nfts/:id', auth, upload.single('picture'), async (req, res) => {
  try {
    const nft = await NFT.findById(req.params.id);

    if (!nft) {
      return res.status(404).json({ message: 'NFT not found' });
    }

    const user = await User.findById(req.userId);

    // Check if the user is the creator
    if (!user || nft.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // If a new picture file is provided, update the picture field
    if (req.file) {
      nft.picture = req.file.originalname;
    }

    // Update other fields if needed
    nft.itemTitle = req.body.itemTitle || nft.itemTitle;
    nft.description = req.body.description || nft.description;
    nft.price = req.body.price || nft.price;
    nft.royalties = req.body.royalties || nft.royalties;

    // Save the updated NFT
    const updatedNFT = await nft.save();

    res.json(updatedNFT);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete NFT
/**
 * @swagger
 * /nfts/{id}:
 *   delete:
 *     summary: Delete a specific NFT by ID
 *     tags: [NFTs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         type: string
 *         required: true
 *         description: The ID of the NFT to delete
 *     responses:
 *       200:
 *         description: The deleted NFT
 *         schema:
 *           $ref: '#/definitions/NFT'
 *       404:
 *         description: NFT not found
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * definitions:
 *   NFT:
 *     type: object
 *     properties:
 *       itemTitle:
 *         type: string
 *       description:
 *         type: string
 *       price:
 *         type: number
 *       royalties:
 *         type: number
 *     required:
 *       - itemTitle
 *       - description
 *       - price
 *       - royalties
 */

module.exports = router;

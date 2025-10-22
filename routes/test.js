import express from 'express';
import userModel from '../models/userModel.js';

const router = express.Router();

router.delete('/delete-user/:email', async (req, res) => {
  const email = req.params.email;
  try {
    await userModel.deleteOne({ email });
    res.send({ deleted: true });
  } catch (err) {
    res.status(500).send({ deleted: false, error: err.message });
  }
});

export default router;

import express from 'express';
import multer from 'multer';
import { getChatHistory, sendMessage} from '../controllers/chat.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js';
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
	  cb(null, "./temp");
	},
	filename: (req, file, cb) => {
	  cb(
		null,
		file.fieldname + "-" + Date.now() + "." + file.mimetype.split("/")[1]
	  );
	},
  });
  
  const upload = multer({ storage: storage });



const router = express.Router();

router.get('/:recipientId', protectRoute, getChatHistory);
router.post('/send', protectRoute,upload.single('image'), sendMessage);


router.post('/send', protectRoute,upload.fields([ // Handle image and video file uploads
	  { name: 'image', maxCount: 1 }, // Allow 1 image
	  { name: 'video', maxCount: 1 }, // Allow 1 video
	]), sendMessage);

export default router;

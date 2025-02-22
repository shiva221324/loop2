import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: function() { return !this.image; } },
  timestamp: { type: Date, default: Date.now },
  image: { type: String },
  deliveryStatus: {
    type: String, 
    enum: ['sent', 'delivered', 'seen'], 
    default: 'sent' 
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
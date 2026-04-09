const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  authorName:  { type: String, required: true, trim: true },
  authorEmail: { type: String, required: true, lowercase: true, trim: true },
  content:     { type: String, required: true, maxlength: 300, trim: true },
  createdAt:   { type: Date, default: Date.now }
}, { _id: true });

const feedPostSchema = new mongoose.Schema({
  authorName:  { type: String, required: true, trim: true },
  authorEmail: { type: String, required: true, lowercase: true, trim: true },
  type:        { type: String, enum: ['post', 'question', 'alert', 'emergency'], default: 'post' },
  content:     { type: String, required: true, maxlength: 500, trim: true },
  createdAt:   { type: Date, default: Date.now },
  replies:     [replySchema]
});

feedPostSchema.index({ createdAt: -1 });
feedPostSchema.index({ type: 1 });

module.exports = mongoose.models.FeedPost || mongoose.model('FeedPost', feedPostSchema);

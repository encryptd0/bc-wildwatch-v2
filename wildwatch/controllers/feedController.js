const FeedPost = require('../models/FeedPost');
const { connectDB } = require('../lib/db');

const VALID_TYPES = ['post', 'question', 'alert', 'emergency'];
const PAGE_SIZE = 20;

exports.feedPage = async (req, res) => {
  try {
    await connectDB();
    const posts = await FeedPost.find()
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .lean();
    res.render('feed', {
      title: 'Community Feed - BC WildWatch',
      posts
    });
  } catch (err) {
    console.error('feedPage error:', err);
    res.render('feed', { title: 'Community Feed - BC WildWatch', posts: [] });
  }
};

exports.getPosts = async (req, res) => {
  try {
    await connectDB();
    const { before, after } = req.query;

    if (after) {
      // For polling — return posts newer than timestamp
      const posts = await FeedPost.find({ createdAt: { $gt: new Date(after) } })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ posts });
    }

    const filter = before ? { createdAt: { $lt: new Date(before) } } : {};
    const posts = await FeedPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .lean();
    const hasMore = posts.length === PAGE_SIZE;
    res.json({ posts, hasMore });
  } catch (err) {
    console.error('getPosts error:', err);
    res.status(500).json({ error: 'Failed to load posts.' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, type } = req.body;
    const user = req.sessionUser;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content is required.' });
    }
    if (content.trim().length > 500) {
      return res.status(400).json({ error: 'Post must be 500 characters or fewer.' });
    }
    const postType = VALID_TYPES.includes(type) ? type : 'post';

    await connectDB();
    const post = await FeedPost.create({
      authorName:  user.name,
      authorEmail: user.email,
      type:        postType,
      content:     content.trim()
    });

    res.json({ success: true, post });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
};

exports.addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const user = req.sessionUser;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content is required.' });
    }
    if (content.trim().length > 300) {
      return res.status(400).json({ error: 'Reply must be 300 characters or fewer.' });
    }

    await connectDB();
    const post = await FeedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    post.replies.push({
      authorName:  user.name,
      authorEmail: user.email,
      content:     content.trim()
    });
    await post.save();

    res.json({ success: true, post });
  } catch (err) {
    console.error('addReply error:', err);
    res.status(500).json({ error: 'Failed to add reply.' });
  }
};

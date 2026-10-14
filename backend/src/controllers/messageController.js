const Message = require('../models/Message');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getMessages = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return sendError(res, 'Page must be positive and limit must be between 1 and 100.', 400);
  }
  if (search.length > 100) return sendError(res, 'Search must be 100 characters or fewer.', 400);
  const query = {};
  if (status === 'unread') query.status = 'new';
  else if (status === 'read') query.status = 'read';
  else if (status && ['new', 'replied', 'archived'].includes(status)) query.status = status;
  else if (status && status !== 'all') return sendError(res, 'Invalid message status filter.', 400);

  if (search) {
    const expression = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ fullName: expression }, { email: expression }, { subject: expression }];
  }

  const [messages, total] = await Promise.all([
    Message.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Message.countDocuments(query),
  ]);

  return sendSuccess(res, 'Messages fetched successfully.', {
    data: messages,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / Number(limit)) || 0,
    },
  });
});

const getMessageById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid message id.', 400);
  const message = await Message.findById(req.params.id);
  if (!message) {
    return sendError(res, 'Message not found.', 404);
  }

  return sendSuccess(res, 'Message fetched successfully.', message);
});

const createMessage = asyncHandler(async (req, res) => {
  const message = await Message.create(req.body);
  return sendSuccess(res, 'Message sent successfully.', message, 201);
});

const updateMessage = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid message id.', 400);
  if (Object.keys(req.body || {}).some((field) => field !== 'status') || req.body?.status === undefined) {
    return sendError(res, 'Only message status can be updated.', 400);
  }
  const message = await Message.findById(req.params.id);
  if (!message) {
    return sendError(res, 'Message not found.', 404);
  }

  message.status = req.body.status;
  await message.save();
  return sendSuccess(res, 'Message updated successfully.', message);
});

const deleteMessage = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return sendError(res, 'Invalid message id.', 400);
  const message = await Message.findById(req.params.id);
  if (!message) {
    return sendError(res, 'Message not found.', 404);
  }

  await message.deleteOne();
  return sendSuccess(res, 'Message deleted successfully.');
});

module.exports = { getMessages, getMessageById, createMessage, updateMessage, deleteMessage };

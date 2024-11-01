const mongoose = require('mongoose');

const KYCRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'In Progress', 'Completed', 'Rejected']
    },
    assigner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    valid_until: {
      type: Date,
      default: null // Set when status is marked as "Completed"
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const KYCRequest = mongoose.model('KYCRequest', KYCRequestSchema);

module.exports = KYCRequest;

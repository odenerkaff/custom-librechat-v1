const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'completed' // Sempre completa na criação
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: Date.now // Completa automaticamente
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para melhor performance
ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ referredUser: 1 });
ReferralSchema.index({ status: 1 });
ReferralSchema.index({ referrer: 1, createdAt: -1 });

// Virtual populate para melhor performance na API
ReferralSchema.virtual('referrerData', {
  ref: 'User',
  localField: 'referrer',
  foreignField: '_id',
  justOne: true
});

ReferralSchema.virtual('referredUserData', {
  ref: 'User',
  localField: 'referredUser',
  foreignField: '_id',
  justOne: true
});

// Métodos estáticos
ReferralSchema.statics.getReferralsByReferrer = function(referrerId) {
  return this.find({ referrer: referrerId })
    .populate('referredUser', 'name email createdAt')
    .sort({ createdAt: -1 });
};

ReferralSchema.statics.getReferralCount = function(referrerId) {
  return this.countDocuments({
    referrer: referrerId,
    status: 'completed'
  });
};

ReferralSchema.statics.getLeaderboard = function(limit = 10) {
  return this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$referrer',
        totalReferrals: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userData'
      }
    },
    { $unwind: '$userData' },
    {
      $project: {
        referrerId: '$_id',
        totalReferrals: 1,
        name: '$userData.name',
        email: '$userData.email'
      }
    },
    { $sort: { totalReferrals: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('Referral', ReferralSchema);

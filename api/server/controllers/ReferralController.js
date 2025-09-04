const mongoose = require('mongoose');

// Import models directly
const Referral = require('~/models/Referral');
let User, Balance;

try {
  const { createModels } = require('@librechat/data-schemas');
  const models = createModels(require('mongoose'));
  User = models.User;
  Balance = models.Balance;
} catch (error) {
  console.error('[Referral] Cannot load User/Balance models from @librechat/data-schemas:', error.message);
  // Fallback direto se data-schemas falhar
  User = require('mongoose').models.User;
  Balance = require('mongoose').models.Balance;
}

// IMPORTANTE: Função de recompensa usando o sistema de balance existente
const grantReferralReward = async (referrerId, rewardAmount = 500) => {
  try {
    console.log(`[REFERRAL] Granting ${rewardAmount} credits to referrer ${referrerId}`);

    // Buscar o balance atual do referrer
    const balanceRecord = await Balance.findOne({ user: referrerId }).lean();

    if (!balanceRecord) {
      console.log(`[REFERRAL] No balance record found for user ${referrerId}. Creating one.`);
      const newBalance = new Balance({
        user: referrerId,
        tokenCredits: rewardAmount,
        context: 'referral-reward-initial',
        autoRefillEnabled: true,
        refillIntervalValue: 1,
        refillIntervalUnit: 'days',
        refillAmount: 10000
      });
      await newBalance.save();
      console.log(`[REFERRAL] Created new balance with ${rewardAmount} credits for referrer`);
      return rewardAmount;
    } else {
      // Atualizar balance existente
      const updatedBalance = await Balance.findOneAndUpdate(
        { user: referrerId },
        {
          $inc: { tokenCredits: rewardAmount },
          $set: { context: 'referral-reward-added' }
        },
        { new: true }
      );

      if (!updatedBalance) {
        throw new Error(`Failed to update balance for user ${referrerId}`);
      }

      console.log(`[REFERRAL] Updated balance from ${balanceRecord.tokenCredits} to ${updatedBalance.tokenCredits} credits`);
      return updatedBalance.tokenCredits;
    }
  } catch (error) {
    console.error(`[REFERRAL] Error granting referral reward:`, error);
    throw error;
  }
};

// Gerar código de referral único baseado no user ID
const generateReferralCode = (userId) => {
  // Pegar os últimos 6 caracteres do _id do usuário
  return userId.toString().slice(-6).toUpperCase();
};

// CRIAR REGISTRO DE REFERRAL E DAR RECOMPENSA
const createReferralRecord = async (referrerId, referredUserId) => {
  try {
    console.log(`[REFERRAL] Creating referral record: referrer=${referrerId}, referred=${referredUserId}`);

    // Verificar se não é auto-indicação
    if (referrerId.toString() === referredUserId.toString()) {
      throw new Error('Users cannot refer themselves');
    }

    // Criar registro de referral
    const referral = new Referral({
      referrer: referrerId,
      referredUser: referredUserId,
      status: 'completed',
      completedAt: new Date()
    });

    await referral.save();
    console.log(`[REFERRAL] Referral record created successfully`);

    // DAR RECOMPENSA DE 500 CRÉDITOS
    const newBalance = await grantReferralReward(referrerId, 500);
    console.log(`[REFERRAL] Referral reward applied! New balance: ${newBalance} credits`);

    return referral;
  } catch (error) {
    console.error('[REFERRAL] Error creating referral record:', error);
    throw error;
  }
};

// === ENDPOINTS ===

// GET /referral/me - Dados pessoais de referral do usuário logado
const getReferralDataController = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Buscar balance atual
    const balanceRecord = await Balance.findOne({ user: userId }).lean();
    const currentBalance = balanceRecord?.tokenCredits || 0;

    // Contar referidos completados
    const totalReferrals = await Referral.countDocuments({
      referrer: userId,
      status: 'completed'
    });

    // Gerar código de referral
    const referralCode = generateReferralCode(user._id);

    // Link completo para indicação
    const referralLink = `${process.env.DOMAIN_CLIENT || 'http://localhost:3090'}/register?ref=${referralCode}`;

    console.log(`[REFERRAL] Getting data for user ${user.name}. Referred: ${totalReferrals}, Balance: ${currentBalance}`);

    res.json({
      referralCode,
      referralLink,
      totalReferrals,
      currentBalance,
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('[REFERRAL] Error getting referral data:', error);
    res.status(500).json({
      message: 'Error retrieving referral data',
      error: error.message
    });
  }
};

// GET /referral/history - Histórico de indicações
const getReferralHistoryController = async (req, res) => {
  try {
    const userId = req.user._id;

    const referrals = await Referral.find({ referrer: userId })
      .populate('referredUser', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedReferrals = referrals.map(ref => ({
      id: ref._id,
      referredUser: {
        name: ref.referredUser.name,
        email: ref.referredUser.email,
        createdAt: ref.referredUser.createdAt
      },
      status: ref.status,
      createdAt: ref.createdAt,
      completedAt: ref.completedAt
    }));

    console.log(`[REFERRAL] Retrieved ${formattedReferrals.length} referrals for user ${userId}`);

    res.json({
      success: true,
      referrals: formattedReferrals,
      total: formattedReferrals.length
    });

  } catch (error) {
    console.error('[REFERRAL] Error getting referral history:', error);
    res.status(500).json({
      message: 'Error retrieving referral history',
      error: error.message
    });
  }
};

// GET /referral/leaderboard - Ranking de indicadores
const getReferralLeaderboardController = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await Referral.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$referrer',
          totalReferrals: { $sum: 1 },
          recentReferrals: { $push: '$createdAt' }
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
          email: '$userData.email',
          lastReferralDate: { $max: '$recentReferrals' }
        }
      },
      { $sort: { totalReferrals: -1 } },
      { $limit: limit }
    ]);

    console.log(`[REFERRAL] Leaderboard loaded with ${leaderboard.length} positions`);

    res.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    console.error('[REFERRAL] Error getting leaderboard:', error);
    res.status(500).json({
      message: 'Error retrieving leaderboard',
      error: error.message
    });
  }
};

// Endpoint para obter dados por código de referral (usado no registro)
const getReferrerByCodeController = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Invalid referral code format' });
    }

    // Buscar usuário cujo referralCode corresponde (comparando últimos 6 caracteres do _id)
    const referrer = await User.findOne(
      {},
      {
        _id: 1,
        name: 1,
        email: 1
      }
    ).lean();

    if (!referrer) {
      return res.status(404).json({ message: 'Referral code not found' });
    }

    // Verificar se o código corresponde aos últimos 6 caracteres do _id
    const expectedCode = referrer._id.toString().slice(-6).toUpperCase();
    if (expectedCode !== code.toUpperCase()) {
      return res.status(404).json({ message: 'Referral code not found' });
    }

    console.log(`[REFERRAL] Referrer found for code ${code}: ${referrer.name}`);

    res.json({
      referrerId: referrer._id,
      referrerName: referrer.name
    });

  } catch (error) {
    console.error('[REFERRAL] Error getting referrer by code:', error);
    res.status(500).json({
      message: 'Error processing referral code',
      error: error.message
    });
  }
};

// Exportar função para ser usada no registro
module.exports = {
  getReferralDataController,
  getReferralHistoryController,
  getReferralLeaderboardController,
  getReferrerByCodeController,
  createReferralRecord,
  generateReferralCode
};

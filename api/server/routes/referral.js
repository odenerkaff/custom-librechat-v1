const express = require('express');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const {
  getReferralDataController,
  getReferralHistoryController,
  getReferralLeaderboardController,
  getReferrerByCodeController
} = require('~/server/controllers/ReferralController');

const router = express.Router();

// Todas as rotas de referral exigem autenticação
router.use(requireJwtAuth);

// GET /referral/me - Dados pessoais do usuário logado
router.get('/me', getReferralDataController);

// GET /referral/history - Histórico de indicações do usuário
router.get('/history', getReferralHistoryController);

// GET /referral/leaderboard - Ranking de quem mais indicou
router.get('/leaderboard', getReferralLeaderboardController);

// GET /referral/code/:code - Resolver código de referral (para registro público)
router.get('/code/:code', getReferrerByCodeController); // Este pode ser público

module.exports = router;

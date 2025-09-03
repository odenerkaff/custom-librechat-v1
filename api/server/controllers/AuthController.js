const cookies = require('cookie');
const jwt = require('jsonwebtoken');
const openIdClient = require('openid-client');
const { isEnabled } = require('@librechat/api');
const { logger } = require('@librechat/data-schemas');
const {
  requestPasswordReset,
  setOpenIDAuthTokens,
  resetPassword,
  setAuthTokens,
  registerUser,
} = require('~/server/services/AuthService');
const { findUser, getUserById, deleteAllUserSessions, findSession } = require('~/models');
const { getOpenIdConfig } = require('~/strategies');
const { getGraphApiToken } = require('~/server/services/GraphTokenService');

const registrationController = async (req, res) => {
  try {
    // Verificar se há um código de referral na query string
    const referralCode = req.query.ref;

    console.log(`[REGISTRATION] Starting registration for user: ${req.body.email}`);
    if (referralCode) {
      console.log(`[REGISTRATION] Referral code detected: ${referralCode}`);
    }

    // Primeiro criar o usuário normalmente
    const response = await registerUser(req.body);
    const { status, message } = response;

    // Se usuário foi criado com sucesso E há código de referral
    if (status === 201 && referralCode) {
      try {
        console.log(`[REGISTRATION] User created successfully, processing referral code: ${referralCode}`);

        // Criar instancias dos modelos para usar na criação do referral
        let models;
        let Referral;
        try {
          const { createModels } = require('@librechat/data-schemas');
          models = createModels(require('mongoose'));
          Referral = models.Referral;
          console.log('[REGISTRATION] Referral model loaded successfully');
        } catch (modelError) {
          console.error('[REGISTRATION] Failed to load referral model:', modelError.message);
          // Continue sem referral se houver erro no modelo
          return res.status(status).send({ message });
        }

        // Resolver referrer usando o código
        let referrer = null;
        if (Referral) {
          // Buscar usuário pelo referralCode (comparando últimos 6 chars do _id)
          const { User } = require('mongoose').models;
          referrer = await User.findOne(
            {},
            {
              _id: 1,
              name: 1,
              email: 1
            }
          ).lean();

          if (referrer) {
            // Verificar se o código corresponde aos últimos 6 chars do _id
            const expectedCode = referrer._id.toString().slice(-6).toUpperCase();
            if (expectedCode !== referralCode.toUpperCase()) {
              console.log(`[REGISTRATION] Referral code ${referralCode} does not match user ${referrer._id}`);
              referrer = null;
            }
          }
        }

        if (referrer && Referral) {
          console.log(`[REGISTRATION] Found valid referrer: ${referrer.name} (${referrer.email})`);

          // Buscar o usuário recém-criado para obter o ID
          const { findUser } = require('~/models');
          const newUser = await findUser({ email: req.body.email });

          if (newUser) {
            console.log(`[REGISTRATION] New user ID: ${newUser._id}`);

            // Criar registro de referral
            const referral = new Referral({
              referrer: referrer._id,
              referredUser: newUser._id,
              status: 'completed',
              completedAt: new Date()
            });

            await referral.save();
            console.log(`[REGISTRATION] Referral record created successfully`);

            // IMPORTANTE: Dar recompensa de 500 créditos ao referrer
            try {
              const { Balance } = models;

              // Buscar balance atual do referrer
              const balanceRecord = await Balance.findOne({ user: referrer._id }).lean();

              const rewardAmount = 500;
              console.log(`[REGISTRATION] Granting ${rewardAmount} credits to referrer ${referrer.name}`);

              if (balanceRecord) {
                // Atualizar balance existente
                await Balance.findOneAndUpdate(
                  { user: referrer._id },
                  {
                    $inc: { tokenCredits: rewardAmount },
                    $set: { context: 'referral-reward-added' }
                  },
                  { new: true }
                );
                console.log(`[REGISTRATION] Updated balance for referrer: +${rewardAmount} credits`);
              } else {
                // Criar novo balance se não existir
                const newBalance = new Balance({
                  user: referrer._id,
                  tokenCredits: rewardAmount,
                  context: 'referral-reward-initial',
                  autoRefillEnabled: true,
                  refillIntervalValue: 1,
                  refillIntervalUnit: 'days',
                  refillAmount: 10000
                });
                await newBalance.save();
                console.log(`[REGISTRATION] Created new balance for referrer: ${rewardAmount} credits`);
              }

              // Log do sucesso
              console.log(`[REGISTRATION] ✅ REFERRAL PROCESS COMPLETED:`);
              console.log(`   📝 Referrer: ${referrer.name} (${referrer.email})`);
              console.log(`   👤 New User: ${newUser.name} (${newUser.email})`);
              console.log(`   💰 Reward: ${rewardAmount} credits`);
              console.log(`   🎉 Status: COMPLETED`);

            } catch (rewardError) {
              console.error('[REGISTRATION] Error granting referral reward:', rewardError);
              // Não falhar o registro por erro na recompensa
            }

          } else {
            console.error('[REGISTRATION] Could not find newly created user');
          }

        } else {
          console.log(`[REGISTRATION] No valid referrer found for code: ${referralCode}`);
        }

      } catch (referralError) {
        console.error('[REGISTRATION] Error processing referral:', referralError);
        // Continue com o registro normal mesmo se referral falhar
      }
    }

    console.log(`[REGISTRATION] Registration completed with status: ${status}`);

    res.status(status).send({ message });
  } catch (err) {
    logger.error('[registrationController]', err);
    return res.status(500).json({ message: err.message });
  }
};

const resetPasswordRequestController = async (req, res) => {
  try {
    const resetService = await requestPasswordReset(req);
    if (resetService instanceof Error) {
      return res.status(400).json(resetService);
    } else {
      return res.status(200).json(resetService);
    }
  } catch (e) {
    logger.error('[resetPasswordRequestController]', e);
    return res.status(400).json({ message: e.message });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const resetPasswordService = await resetPassword(
      req.body.userId,
      req.body.token,
      req.body.password,
    );
    if (resetPasswordService instanceof Error) {
      return res.status(400).json(resetPasswordService);
    } else {
      await deleteAllUserSessions({ userId: req.body.userId });
      return res.status(200).json(resetPasswordService);
    }
  } catch (e) {
    logger.error('[resetPasswordController]', e);
    return res.status(400).json({ message: e.message });
  }
};

const refreshController = async (req, res) => {
  const refreshToken = req.headers.cookie ? cookies.parse(req.headers.cookie).refreshToken : null;
  const token_provider = req.headers.cookie
    ? cookies.parse(req.headers.cookie).token_provider
    : null;
  if (!refreshToken) {
    return res.status(200).send('Refresh token not provided');
  }
  if (token_provider === 'openid' && isEnabled(process.env.OPENID_REUSE_TOKENS) === true) {
    try {
      const openIdConfig = getOpenIdConfig();
      const tokenset = await openIdClient.refreshTokenGrant(openIdConfig, refreshToken);
      const claims = tokenset.claims();
      const user = await findUser({ email: claims.email });
      if (!user) {
        return res.status(401).redirect('/login');
      }
      const token = setOpenIDAuthTokens(tokenset, res);
      return res.status(200).send({ token, user });
    } catch (error) {
      logger.error('[refreshController] OpenID token refresh error', error);
      return res.status(403).send('Invalid OpenID refresh token');
    }
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await getUserById(payload.id, '-password -__v -totpSecret -backupCodes');
    if (!user) {
      return res.status(401).redirect('/login');
    }

    const userId = payload.id;

    if (process.env.NODE_ENV === 'CI') {
      const token = await setAuthTokens(userId, res);
      return res.status(200).send({ token, user });
    }

    // Find the session with the hashed refresh token
    const session = await findSession({
      userId: userId,
      refreshToken: refreshToken,
    });

    if (session && session.expiration > new Date()) {
      const token = await setAuthTokens(userId, res, session._id);
      res.status(200).send({ token, user });
    } else if (req?.query?.retry) {
      // Retrying from a refresh token request that failed (401)
      res.status(403).send('No session found');
    } else if (payload.exp < Date.now() / 1000) {
      res.status(403).redirect('/login');
    } else {
      res.status(401).send('Refresh token expired or not found for this user');
    }
  } catch (err) {
    logger.error(`[refreshController] Refresh token: ${refreshToken}`, err);
    res.status(403).send('Invalid refresh token');
  }
};

const graphTokenController = async (req, res) => {
  try {
    // Validate user is authenticated via Entra ID
    if (!req.user.openidId || req.user.provider !== 'openid') {
      return res.status(403).json({
        message: 'Microsoft Graph access requires Entra ID authentication',
      });
    }

    // Check if OpenID token reuse is active (required for on-behalf-of flow)
    if (!isEnabled(process.env.OPENID_REUSE_TOKENS)) {
      return res.status(403).json({
        message: 'SharePoint integration requires OpenID token reuse to be enabled',
      });
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Valid authorization token required',
      });
    }

    // Get scopes from query parameters
    const scopes = req.query.scopes;
    if (!scopes) {
      return res.status(400).json({
        message: 'Graph API scopes are required as query parameter',
      });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    const tokenResponse = await getGraphApiToken(req.user, accessToken, scopes);

    res.json(tokenResponse);
  } catch (error) {
    logger.error('[graphTokenController] Failed to obtain Graph API token:', error);
    res.status(500).json({
      message: 'Failed to obtain Microsoft Graph token',
    });
  }
};

module.exports = {
  refreshController,
  registrationController,
  resetPasswordController,
  resetPasswordRequestController,
  graphTokenController,
};

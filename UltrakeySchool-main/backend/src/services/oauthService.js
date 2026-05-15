import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// OAuth Account Schema
const oauthAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    enum: ['google', 'microsoft', 'facebook', 'github'],
    required: true,
  },
  providerId: {
    type: String,
    required: true,
  },
  email: String,
  displayName: String,
  profilePicture: String,
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

oauthAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });

const OAuthAccount = mongoose.model('OAuthAccount', oauthAccountSchema);

class OAuthService {
  constructor() {
    // Google OAuth
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Microsoft OAuth
    this.microsoftConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      redirectUri: process.env.MICROSOFT_REDIRECT_URI,
      authority: 'https://login.microsoftonline.com/common',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoEndpoint: 'https://graph.microsoft.com/v1.0/me',
    };
  }

  /**
   * Get Google OAuth URL
   * @param {string} state - State parameter
   * @returns {string} Authorization URL
   */
  getGoogleAuthUrl(state) {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
    });
  }

  /**
   * Verify Google OAuth token
   * @param {string} code - Authorization code
   * @returns {Object} User info
   */
  async verifyGoogleToken(code) {
    try {
      const { tokens } = await this.googleClient.getToken(code);
      this.googleClient.setCredentials(tokens);

      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      return {
        providerId: payload.sub,
        email: payload.email,
        displayName: payload.name,
        profilePicture: payload.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      };
    } catch (error) {
      logger.error(`Error verifying Google token: ${error.message}`);
      throw new Error('Failed to verify Google token');
    }
  }

  /**
   * Get Microsoft OAuth URL
   * @param {string} state - State parameter
   * @returns {string} Authorization URL
   */
  getMicrosoftAuthUrl(state) {
    const scopes = ['openid', 'profile', 'email', 'User.Read'];
    
    const params = new URLSearchParams({
      client_id: this.microsoftConfig.clientId,
      response_type: 'code',
      redirect_uri: this.microsoftConfig.redirectUri,
      response_mode: 'query',
      scope: scopes.join(' '),
      state,
    });

    return `${this.microsoftConfig.authority}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Verify Microsoft OAuth token
   * @param {string} code - Authorization code
   * @returns {Object} User info
   */
  async verifyMicrosoftToken(code) {
    try {
      // Exchange code for token
      const tokenResponse = await axios.post(
        this.microsoftConfig.tokenEndpoint,
        new URLSearchParams({
          client_id: this.microsoftConfig.clientId,
          client_secret: this.microsoftConfig.clientSecret,
          code,
          redirect_uri: this.microsoftConfig.redirectUri,
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Get user info
      const userResponse = await axios.get(
        this.microsoftConfig.userInfoEndpoint,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const user = userResponse.data;

      return {
        providerId: user.id,
        email: user.mail || user.userPrincipalName,
        displayName: user.displayName,
        profilePicture: null,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      };
    } catch (error) {
      logger.error(`Error verifying Microsoft token: ${error.message}`);
      throw new Error('Failed to verify Microsoft token');
    }
  }

  /**
   * Link OAuth account to user
   * @param {string} userId - User ID
   * @param {string} provider - OAuth provider
   * @param {Object} providerData - Provider data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} OAuth account
   */
  async linkAccount(userId, provider, providerData, tenantId) {
    try {
      let oauthAccount = await OAuthAccount.findOne({
        provider,
        providerId: providerData.providerId,
      });

      if (oauthAccount) {
        if (oauthAccount.user.toString() !== userId) {
          throw new Error('This account is already linked to another user');
        }

        // Update existing account
        oauthAccount.accessToken = providerData.accessToken;
        oauthAccount.refreshToken = providerData.refreshToken;
        oauthAccount.expiresAt = providerData.expiresAt;
        oauthAccount.email = providerData.email;
        oauthAccount.displayName = providerData.displayName;
        oauthAccount.profilePicture = providerData.profilePicture;
      } else {
        // Create new account
        oauthAccount = new OAuthAccount({
          user: userId,
          provider,
          providerId: providerData.providerId,
          email: providerData.email,
          displayName: providerData.displayName,
          profilePicture: providerData.profilePicture,
          accessToken: providerData.accessToken,
          refreshToken: providerData.refreshToken,
          expiresAt: providerData.expiresAt,
          tenant: tenantId,
        });
      }

      await oauthAccount.save();

      logger.info(`OAuth account linked: ${provider} for user ${userId}`);
      return oauthAccount;
    } catch (error) {
      logger.error(`Error linking OAuth account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Login or register with OAuth
   * @param {string} provider - OAuth provider
   * @param {Object} providerData - Provider data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} User and tokens
   */
  async loginOrRegister(provider, providerData, tenantId) {
    try {
      const User = mongoose.model('User');

      // Check if OAuth account exists
      let oauthAccount = await OAuthAccount.findOne({
        provider,
        providerId: providerData.providerId,
      }).populate('user');

      if (oauthAccount) {
        // Update tokens
        oauthAccount.accessToken = providerData.accessToken;
        oauthAccount.refreshToken = providerData.refreshToken;
        oauthAccount.expiresAt = providerData.expiresAt;
        await oauthAccount.save();

        // Generate JWT tokens
        const tokens = this.generateTokens(oauthAccount.user);

        logger.info(`OAuth login: ${provider} for user ${oauthAccount.user._id}`);
        return {
          user: oauthAccount.user,
          ...tokens,
          isNewUser: false,
        };
      }

      // Check if user exists with this email
      let user = await User.findOne({
        email: providerData.email,
        tenant: tenantId,
      });

      if (!user) {
        // Create new user
        user = new User({
          email: providerData.email,
          name: providerData.displayName,
          profilePicture: providerData.profilePicture,
          role: 'student', // Default role
          tenant: tenantId,
          isEmailVerified: true, // OAuth emails are verified
          authProvider: provider,
        });

        await user.save();
        logger.info(`New user created via OAuth: ${user._id}`);
      }

      // Link OAuth account
      await this.linkAccount(user._id, provider, providerData, tenantId);

      // Generate JWT tokens
      const tokens = this.generateTokens(user);

      return {
        user,
        ...tokens,
        isNewUser: !oauthAccount,
      };
    } catch (error) {
      logger.error(`Error in OAuth login/register: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unlink OAuth account
   * @param {string} userId - User ID
   * @param {string} provider - OAuth provider
   * @param {string} tenantId - Tenant ID
   * @returns {boolean} Success status
   */
  async unlinkAccount(userId, provider, tenantId) {
    try {
      const result = await OAuthAccount.findOneAndDelete({
        user: userId,
        provider,
        tenant: tenantId,
      });

      if (!result) {
        throw new Error('OAuth account not found');
      }

      logger.info(`OAuth account unlinked: ${provider} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error unlinking OAuth account: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get linked accounts
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Linked accounts
   */
  async getLinkedAccounts(userId, tenantId) {
    try {
      const accounts = await OAuthAccount.find({
        user: userId,
        tenant: tenantId,
      }).select('-accessToken -refreshToken');

      return accounts;
    } catch (error) {
      logger.error(`Error getting linked accounts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   * @param {Object} user - User object
   * @returns {Object} Access and refresh tokens
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        institution: user.tenant,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}

export default new OAuthService();

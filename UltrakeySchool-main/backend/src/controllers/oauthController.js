import oauthService from '../services/oauthService.js';
import logger from '../utils/logger.js';

class OAuthController {
  async getGoogleAuthUrl(req, res) {
    try {
      const state = req.query.state || Math.random().toString(36).substring(7);
      const url = oauthService.getGoogleAuthUrl(state);

      res.json({
        success: true,
        data: { url, state },
      });
    } catch (error) {
      logger.error(`Error getting Google auth URL: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async googleCallback(req, res) {
    try {
      const { code } = req.query;
      const tenantId = req.query.tenant || req.body.tenant;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code is required',
        });
      }

      const providerData = await oauthService.verifyGoogleToken(code);
      const result = await oauthService.loginOrRegister(
        'google',
        providerData,
        tenantId
      );

      res.json({
        success: true,
        message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        data: result,
      });
    } catch (error) {
      logger.error(`Error in Google callback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMicrosoftAuthUrl(req, res) {
    try {
      const state = req.query.state || Math.random().toString(36).substring(7);
      const url = oauthService.getMicrosoftAuthUrl(state);

      res.json({
        success: true,
        data: { url, state },
      });
    } catch (error) {
      logger.error(`Error getting Microsoft auth URL: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async microsoftCallback(req, res) {
    try {
      const { code } = req.query;
      const tenantId = req.query.tenant || req.body.tenant;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code is required',
        });
      }

      const providerData = await oauthService.verifyMicrosoftToken(code);
      const result = await oauthService.loginOrRegister(
        'microsoft',
        providerData,
        tenantId
      );

      res.json({
        success: true,
        message: result.isNewUser ? 'Account created successfully' : 'Login successful',
        data: result,
      });
    } catch (error) {
      logger.error(`Error in Microsoft callback: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async linkAccount(req, res) {
    try {
      const { provider, code } = req.body;

      let providerData;
      if (provider === 'google') {
        providerData = await oauthService.verifyGoogleToken(code);
      } else if (provider === 'microsoft') {
        providerData = await oauthService.verifyMicrosoftToken(code);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid provider',
        });
      }

      const account = await oauthService.linkAccount(
        req.user.id,
        provider,
        providerData,
        req.user.institution
      );

      res.json({
        success: true,
        message: 'Account linked successfully',
        data: account,
      });
    } catch (error) {
      logger.error(`Error linking account: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async unlinkAccount(req, res) {
    try {
      const { provider } = req.params;

      await oauthService.unlinkAccount(
        req.user.id,
        provider,
        req.user.institution
      );

      res.json({
        success: true,
        message: 'Account unlinked successfully',
      });
    } catch (error) {
      logger.error(`Error unlinking account: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getLinkedAccounts(req, res) {
    try {
      const accounts = await oauthService.getLinkedAccounts(
        req.user.id,
        req.user.institution
      );

      res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      logger.error(`Error getting linked accounts: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new OAuthController();

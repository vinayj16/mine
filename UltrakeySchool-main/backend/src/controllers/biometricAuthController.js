import biometricAuthService from '../services/biometricAuthService.js';
import logger from '../utils/logger.js';

class BiometricAuthController {
  async registerCredential(req, res) {
    try {
      const credential = await biometricAuthService.registerCredential(
        req.user.id,
        req.body,
        req.user.institution
      );

      res.status(201).json({
        success: true,
        message: 'Biometric credential registered successfully',
        data: credential,
      });
    } catch (error) {
      logger.error(`Error registering credential: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async generateChallenge(req, res) {
    try {
      const challenge = await biometricAuthService.generateChallenge(
        req.user.id,
        req.user.institution
      );

      res.json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      logger.error(`Error generating challenge: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async verifyAuthentication(req, res) {
    try {
      const verified = await biometricAuthService.verifyAuthentication(
        req.user.id,
        req.body,
        req.user.institution
      );

      if (verified) {
        res.json({
          success: true,
          message: 'Biometric authentication successful',
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Biometric authentication failed',
        });
      }
    } catch (error) {
      logger.error(`Error verifying authentication: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getUserCredentials(req, res) {
    try {
      const credentials = await biometricAuthService.getUserCredentials(
        req.user.id,
        req.user.institution
      );

      res.json({
        success: true,
        data: credentials,
      });
    } catch (error) {
      logger.error(`Error getting credentials: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async revokeCredential(req, res) {
    try {
      const { credentialId } = req.params;
      await biometricAuthService.revokeCredential(
        req.user.id,
        credentialId,
        req.user.institution
      );

      res.json({
        success: true,
        message: 'Credential revoked successfully',
      });
    } catch (error) {
      logger.error(`Error revoking credential: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteCredential(req, res) {
    try {
      const { credentialId } = req.params;
      await biometricAuthService.deleteCredential(
        req.user.id,
        credentialId,
        req.user.institution
      );

      res.json({
        success: true,
        message: 'Credential deleted successfully',
      });
    } catch (error) {
      logger.error(`Error deleting credential: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getStatistics(req, res) {
    try {
      const stats = await biometricAuthService.getStatistics(
        req.user.institution
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error(`Error getting statistics: ${error.message}`);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new BiometricAuthController();

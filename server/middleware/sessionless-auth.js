const passport = require('passport');
const getHeaderUser = require('../lib/get-header-user');
require('../typedefs');

/**
 * Middleware to handle passive/sessionless authentication means
 *
 * These kinds of authentications are usually something similar to an API key
 * and do not use the session cookie like other methods.
 * (Google and SAML authenticate with their targets, but still result in a SQLPad user and associated session)
 *
 * @param {import('express').Request & Req} req
 * @param {*} res
 * @param {function} next
 */
function sessionlessAuth(req, res, next) {
  const { config } = req;

  // If the request is already authenticated via something that keeps a session continue
  if (req.isAuthenticated()) {
    return next();
  }

  // If auth is disabled, hardcode a user and continue on
  if (config.get('disableAuth')) {
    req.user = {
      id: 'noauth',
      _id: 'noauth',
      role: 'admin',
      email: 'test@example.com'
    };
    return next();
  }

  // If authorization header is present, attempt to authenticate based on the type of auth header
  const authHeader = req.get('authorization');
  if (authHeader) {
    // If authorization starts with Bearer and serviceTokenSecret is set,
    // we're going to guess it is a service token jwt
    if (authHeader.startsWith('Bearer ') && config.get('serviceTokenSecret')) {
      return passport.authenticate('jwt', { session: false })(req, res, next);
    }

    // If authoriztion starts with Basic and local auth isn't disabled,
    // try HTTP basic authentication
    if (authHeader.startsWith('Basic ') && !config.get('disableUserpassAuth')) {
      return passport.authenticate('basic', { session: false })(req, res, next);
    }
  }

  // If auth proxy is turned on, try to derive a user from headers
  if (config.get('authProxyEnabled')) {
    const headerUser = getHeaderUser(req);
    if (headerUser) {
      return passport.authenticate('auth-proxy', { session: false })(
        req,
        res,
        next
      );
    }
  }

  // None of the passive auth strategies matched, continue on
  // If middleware further down requires auth a response will be sent appropriately
  next();
}

module.exports = sessionlessAuth;

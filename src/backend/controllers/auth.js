import passport from 'koa-passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import Router from '@koa/router';
import auth from '../middleware/auth.js';
import { getLogger } from '../log.js';

const log = getLogger('backend:controllers:auth');

/**
 * Initialize the user auth controller
 *
 * @param {Object} users - User model
 * @returns {Object} Auth controller Koa router
 */
export default function controller(users, config) {
  const router = new Router();
  log.debug('Authentication strategy: ', config.authStrategy);

  /**
   * Serialize user
   *
   * @param {Object} user - User info
   * @param {function} done - 'Done' callback
   */
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  /**
   * Deserialize user from session
   *
   * @param {integer} id - User id
   * @param {function} done - 'Done' callback
   */
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await users.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  /**
   * Initialize passport strategy
   *
   * @param {string} username - Username
   * @param {string} password - Password
   * @param {function} done - 'Done' callback
   */
  if (config.authStrategy === 'oauth2') {
    passport.use(
      new OAuth2Strategy(
        {
          authorizationURL: config.oauthAuthUrl,
          tokenURL: config.oauthTokenUrl,
          clientID: config.oauthClientId,
          clientSecret: config.oauthClientSecret,
          callbackURL: config.oauthCallbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await users.findByUsername(profile.username);
            log.debug('oauth2 profile: ', profile);
            if (
              profile.username === user.username &&
              profile.password === user.password
            ) {
              done(null, user);
            } else {
              done(null, false);
            }
          } catch (err) {
            done(err);
          }
        },
      ),
    );
  } else {
    passport.use(
      new LocalStrategy(async (username, password, done) => {
        try {
          const user = await users.findByUsername(username);
          if (username === user.username && password === user.password) {
            done(null, user);
          } else {
            done(null, false);
          }
        } catch (err) {
          done(err);
        }
      }),
    );
  }

  /**
   * Login user.
   *
   * @param {Object} ctx - Koa context object
   */
  router.post('/login', async ctx => {
    return passport.authenticate(config.authStrategy, (err, user) => {
      if (!user) {
        ctx.body = { success: false };
        ctx.throw(401, 'Authentication failed.');
      } else {
        if (ctx.request.body.remember === 'true') {
          ctx.session.maxAge = 86400000; // 1 day
        } else {
          ctx.session.maxAge = 'session';
        }
        ctx.body = { success: true };
        return ctx.login(user);
      }
    })(ctx);
  });

  /**
   * Logout user.
   *
   * @param {Object} ctx - Koa context object
   */
  router.get('/logout', async ctx => {
    if (ctx.isAuthenticated()) {
      await ctx.logout();
      ctx.session = null;
      ctx.redirect('/');
    } else {
      ctx.body = { success: false };
      ctx.throw(401, 'Logout failed.');
    }
  });

  /**
   * Authentication required
   *
   * @param {Object} auth - Authentication middleware
   * @param {Object} ctx - Koa context object
   */
  router.get('/authenticated', auth, async ctx => {
    ctx.body = { msg: 'Authenticated', user: ctx.state.user };
  });

  /**
   * Get all users.
   *
   * @param {Object} auth - Authentication middleware
   * @param {Object} ctx - Koa context object
   */
  router.get('/users', auth, async (ctx, next) => {
    const allUsers = await users.findAll();
    ctx.body = allUsers;
    await next();
  });

  /**
   * Get single user
   *
   * @param integer
   * @returns object|null 	User object or null
   */
  router.get('/users/:id', auth, async (ctx, next) => {
    const user = await users.findById(ctx.params.id);
    if (user) {
      ctx.body = user;
    } else {
      ctx.status = 404;
      ctx.body = `User with id ${ctx.params.id} was not found.`;
    }
    await next();
  });

  /**
   * Get oauth2 status.
   *
   * @param {Object} ctx - Koa context object
   */
  router.get('/oauth2/enabled', async ctx => {
    ctx.body = { status: config.authStrategy === 'oauth2' };
  });

  /**
   * Initiate oauth2 login.
   *
   * @param {Object} ctx - Koa context object
   */
  router.get('/oauth2/login', passport.authenticate('oauth2'));

  /**
   * Receive oauth2 callback.
   *
   * @param {Object} ctx - Koa context object
   */
  router.get(
    '/oauth2/callback',
    passport.authenticate('oauth2', {
      successRedirect: '/admin',
      failureRedirect: '/',
    }),
  );

  return router;
}

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
      callbackURL: process.env['GOOGLE_CALLBACK_URL']!,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const email = profile.emails?.[0]?.value ?? undefined;
        const fullName = profile.displayName;
        const googleId = profile.id;

        if (!email) {
          logger.error('No email found in Google profile');
          return done(new Error('No email found in Google profile'), undefined);
        }

        logger.info(`Google OAuth callback for email: ${email}`);

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, update last login
          logger.info(`Existing user logged in: ${email}`);

          // Update user if needed
          if (!user.active) {
            return done(new Error('User account is inactive'), undefined);
          }

          return done(null, user);
        }

        // New user - create with default role
        logger.info(`Creating new user: ${email}`);

        // Generate unique user_id
        const userCount = await prisma.user.count();
        const userId = `USR_${String(userCount + 1).padStart(3, '0')}`;

        user = await prisma.user.create({
          data: {
            email: email,
            fullName: fullName,
            userType: 'FAMILIA', // Default role for new registrations
            status: 'ACTIVE',
          },
        });

        logger.info(`New user created: ${email} with ID: ${userId}`);
        return done(null, user);
      } catch (error) {
        logger.error('Error in Google OAuth callback:', error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Configure JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env['JWT_SECRET']!,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: jwtPayload.userId },
      });

      if (!user) {
        return done(null, false);
      }

      if (!user.active) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      logger.error('Error in JWT strategy:', error);
      return done(error, false);
    }
  })
);

export default passport;

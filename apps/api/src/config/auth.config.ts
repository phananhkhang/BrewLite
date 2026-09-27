export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtIssuer: string;
  jwtAudience: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  bcryptSaltRounds: number;
  cookieOptions: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    maxAge: number;
  };
}

export const authConfig: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'cf40f6ffdda376c12dfb4370b2f84db0a740a6c4efc6eb71032602c99e6ad933',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtIssuer: process.env.JWT_ISSUER || 'brewlite-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'brewlite-web',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'brewlite_refresh_secret_key_2026'),
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  bcryptSaltRounds: 10,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
};

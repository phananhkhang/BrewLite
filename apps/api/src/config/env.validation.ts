export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_EXPIRES_IN: string;
  WEB_ORIGIN: string;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const nodeEnv = (config.NODE_ENV as string) || 'development';
  const port = Number(config.PORT || 3001);
  const databaseUrl = config.DATABASE_URL as string;
  const jwtSecret = config.JWT_SECRET as string;

  const errors: string[] = [];

  if (!databaseUrl) {
    errors.push('DATABASE_URL is required in environment configuration.');
  }

  if (!jwtSecret || jwtSecret === 'replace_with_a_long_random_secret') {
    if (nodeEnv === 'production') {
      errors.push('JWT_SECRET must be configured with a secure random secret in production.');
    }
  }

  if (Number.isNaN(port)) {
    errors.push('PORT must be a valid number.');
  }

  if (errors.length > 0) {
    throw new Error(`[EnvValidationError]\n${errors.map((e) => ` - ${e}`).join('\n')}`);
  }

  return {
    NODE_ENV: nodeEnv as EnvironmentVariables['NODE_ENV'],
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret || 'default_local_dev_secret_only',
    JWT_ISSUER: (config.JWT_ISSUER as string) || 'brewlite-api',
    JWT_AUDIENCE: (config.JWT_AUDIENCE as string) || 'brewlite-web',
    JWT_EXPIRES_IN: (config.JWT_EXPIRES_IN as string) || '15m',
    WEB_ORIGIN: (config.WEB_ORIGIN as string) || 'http://localhost:3000',
  };
}

export type AppEnv = 'development' | 'staging' | 'production';

export interface BaseConfig {
  env: AppEnv;
  port: number;
  serviceName: string;
}

export function loadBaseConfig(serviceName: string): BaseConfig {
  const env = (process.env.NODE_ENV as AppEnv) || 'development';
  const port = Number(process.env.PORT || 3000);

  return {
    env,
    port,
    serviceName,
  };
}

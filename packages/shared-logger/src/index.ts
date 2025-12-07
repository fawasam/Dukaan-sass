import type { BaseConfig } from '@ecom/config';

export function createLogger(config: BaseConfig) {
  const prefix = `[${config.serviceName.toUpperCase()}][${config.env}]`;

  return {
    info: (...args: unknown[]) => console.log(prefix, '[INFO]', ...args),
    error: (...args: unknown[]) => console.error(prefix, '[ERROR]', ...args),
    warn: (...args: unknown[]) => console.warn(prefix, '[WARN]', ...args),
    debug: (...args: unknown[]) => {
      if (config.env === 'development') {
        console.debug(prefix, '[DEBUG]', ...args);
      }
    },
  };
}

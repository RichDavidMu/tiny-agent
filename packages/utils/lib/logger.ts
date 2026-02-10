import createDebug from 'debug';

type DebugArgs = [any, ...any[]];
type Level = 'log' | 'info' | 'warn' | 'error' | 'debug';

function makeLogger(namespace: string) {
  function wrap(level: Level) {
    const logger = createDebug(`${namespace}:${level}`);

    return (...args: DebugArgs) => {
      logger(...args);
    };
  }

  return {
    log: wrap('log'),
    info: wrap('info'),
    warn: wrap('warn'),
    error: wrap('error'),
    debug: wrap('debug'),
  };
}

export const agentLogger = makeLogger('agent-core');
export const webLogger = makeLogger('web-app');

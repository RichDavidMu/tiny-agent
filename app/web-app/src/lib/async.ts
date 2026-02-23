export const createTask = <T = unknown>() => {
  let _resolve: (value?: T | PromiseLike<T>) => void;
  let _reject: (reason?: any) => void;
  const task = new Promise<T>((resolve, reject) => {
    // eslint-disable-next-line
    // @ts-ignore
    _resolve = resolve;
    _reject = reject;
  });
  // eslint-disable-next-line
  // @ts-ignore
  return [task, _resolve, _reject] as const;
};

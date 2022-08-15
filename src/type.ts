export type Class<Instance = any> = new (...args: any[]) => Instance

export type Instance<C> = C extends Class<infer Return> ? Return : never

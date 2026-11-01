import printValue from './util/printValue';
import toArray from './util/toArray';

let strReg = /\$\{\s*(\w+)\s*\}/g;

type Params = Record<string, unknown>;

export default class ValidationError extends Error {
  value: any;
  path?: string;
  type?: string;
  errors: string[];

  params?: Params;

  inner: ValidationError[];

  static formatError(
    message: string | ((params: Params) => string) | unknown,
    params: Params,
  ) {
    const path = params.label || params.path || 'this';
    if (path !== params.path) params = { ...params, path };

    if (typeof message === 'string')
      return message.replace(strReg, (_, key) => printValue(params[key]));
    if (typeof message === 'function') return message(params);

    return message;
  }

  static isError(err: any): err is ValidationError {
    return err && err.name === 'ValidationError';
  }

  constructor(
    errorOrErrors: string | ValidationError | readonly ValidationError[],
    value?: any,
    field?: string,
    type?: string,
    disableStack?: boolean,
  ) {
    // Backport of jquense/yup#2142 (ValidationErrorNoStack), adapted: instead
    // of returning an object that does not extend Error, we keep a real Error
    // instance (so `instanceof ValidationError`, `instanceof Error` and
    // `Object.prototype.toString` keep working) and avoid the stack capture.
    // In V8 `super()` alone already captures the stack, so we temporarily set
    // `Error.stackTraceLimit` to 0 around it.
    const skipStack =
      disableStack === true && typeof Error.stackTraceLimit === 'number';
    const stackTraceLimit = skipStack ? Error.stackTraceLimit : 0;
    if (skipStack) Error.stackTraceLimit = 0;

    super();

    if (skipStack) Error.stackTraceLimit = stackTraceLimit;

    this.name = 'ValidationError';
    this.value = value;
    this.path = field;
    this.type = type;

    this.errors = [];
    this.inner = [];

    toArray(errorOrErrors).forEach((err) => {
      if (ValidationError.isError(err)) {
        this.errors.push(...err.errors);
        // Backport of jquense/yup#2072: `concat` here is quadratic on the
        // number of nested errors.
        const innerErrors = err.inner.length ? err.inner : [err];
        this.inner.push(...innerErrors);
      } else {
        this.errors.push(err);
      }
    });

    this.message =
      this.errors.length > 1
        ? `${this.errors.length} errors occurred`
        : this.errors[0];

    if (!disableStack && Error.captureStackTrace)
      Error.captureStackTrace(this, ValidationError);
  }
}

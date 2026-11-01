import ValidationError from '../src/ValidationError';

describe('ValidationError', () => {
  describe('formatError', () => {
    it('should insert the params into the message', () => {
      const str = ValidationError.formatError('Some message ${param}', {
        param: 'here',
      });
      expect(str).toContain('here');
    });

    it(`should auto include any param named 'label' or 'path' as the 'path' param`, () => {
      const str = ValidationError.formatError('${path} goes here', {
        label: 'label',
      });
      expect(str).toContain('label');
    });

    it(`should use 'this' if a 'label' or 'path' param is not provided`, () => {
      const str = ValidationError.formatError('${path} goes here', {});
      expect(str).toContain('this');
    });

    it(`should include "undefined" in the message if undefined is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: undefined,
      });
      expect(str).toContain('undefined');
    });

    it(`should include "null" in the message if null is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: null,
      });
      expect(str).toContain('null');
    });

    it(`should include "NaN" in the message if null is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: NaN,
      });
      expect(str).toContain('NaN');
    });

    it(`should include 0 in the message if 0 is provided as a param`, () => {
      const str = ValidationError.formatError('${path} value is ${min}', {
        min: 0,
      });
      expect(str).toContain('0');
    });
  });

  it('should disable stacks', () => {
    const disabled = new ValidationError('error', 1, 'field', 'type', true);

    expect(disabled).toBeInstanceOf(ValidationError);
    expect(disabled).toBeInstanceOf(Error);
    expect(Object.prototype.toString.call(disabled)).toBe('[object Error]');
    expect(disabled.stack).not.toMatch(/\n\s+at /);
    expect(disabled.message).toBe('error');
  });

  it('should keep stacks by default when constructed directly', () => {
    const error = new ValidationError('error', 1, 'field', 'type');

    expect(error.stack).toMatch(/\n\s+at /);
  });

  it('should restore Error.stackTraceLimit', () => {
    const limit = Error.stackTraceLimit;
    new ValidationError('error', 1, 'field', 'type', true);

    expect(Error.stackTraceLimit).toBe(limit);
  });

  it('should flatten nested errors in order', () => {
    const leaf = (n: number) => new ValidationError(`e${n}`, n, `p${n}`);
    const group = new ValidationError([leaf(1), leaf(2)]);
    const error = new ValidationError([group, leaf(3)]);

    expect(error.inner.map((e) => e.path)).toEqual(['p1', 'p2', 'p3']);
    expect(error.errors).toEqual(['e1', 'e2', 'e3']);
  });
});

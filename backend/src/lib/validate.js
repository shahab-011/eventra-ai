export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        },
      });
    }
    req[target] = result.data;
    next();
  };
}

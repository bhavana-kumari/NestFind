export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body ?? {},
      query: req.query ?? {},
      params: req.params ?? {},
    });

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return res.status(400).json({
        success: false,
        message: errors.length === 1 ? errors[0].message : "Please check the highlighted fields and try again",
        errors,
      });
    }

    req.validated = parsed.data;
    next();
  };
}

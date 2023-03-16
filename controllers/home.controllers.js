export const home = (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend APIs of ecommerce app',
  });
};

export const createCookieOptions = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  httpOnly: true,
};

export const clearCookieOptions = {
  expires: new Date(),
  httpOnly: true,
};

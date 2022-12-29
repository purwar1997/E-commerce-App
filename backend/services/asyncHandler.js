const asyncHandler = fn => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    res.status(err.code || 401).json({
      success: false,
      message: err.message,
    });
  }
};

// above mentioned code is equivalent to the following code

// function asyncHandler(fn) {
//   return async function (req, res, next) {
//     try {
//       await fn(req, res, next);
//     } catch (err) {
//       res.status(err.code || 401).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   };
// }

export default asyncHandler;

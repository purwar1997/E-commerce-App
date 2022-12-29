class customError extends Error {
  constructor(message, code) {
    // super() will call the constructor of Error class
    super(message);
    this.code = code;
  }
}

export default customError;

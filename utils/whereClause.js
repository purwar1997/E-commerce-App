class WhereClause {
  constructor(base, query) {
    this.base = base;
    this.query = query;
  }

  search() {
    const searchObject = this.query.search
      ? { name: { $regex: this.query.search, $options: 'i' } }
      : {};

    this.base = this.base.find({ ...searchObject });
    return this;
  }

  pagination(resultsPerPage) {
    const currentPage = this.query.page ? this.query.page : 1;
    this.base = this.base.skip(resultsPerPage * (currentPage - 1)).limit(resultsPerPage);
    return this;
  }

  filter() {
    let query = this.query;

    delete query.search;
    delete query.page;

    let queryString = JSON.stringify(query);
    queryString = queryString.replace(/\b(gte|lte|gt|lt)\b/g, str => `$${str}`);

    query = JSON.parse(queryString);

    this.base = this.base.find(query);
    return this;
  }
}

export default WhereClause;

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //BUILD QUERY
    const queryObj = { ...this.queryString }; // deconstructs and creates a query object
    const excludedFields = [
      'page',
      'sort',
      'limit',
      'fields',
    ];
    excludedFields.forEach(
      (el) => delete queryObj[el],
    );

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );

    this.query = this.query.find(
      JSON.parse(queryString),
    );

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(',')
        .join(' ');
      // sort (price ratingsAverage)
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort(
        '-ratingsAverage',
      );
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields
        .split(',')
        .join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
      // __v will not be returned. prefixing with -
    }
    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1; // || 1 defaults to 1
    const limit =
      this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query
      .skip(skip)
      .limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

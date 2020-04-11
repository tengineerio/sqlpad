/**
 * A collection of utilities to send a variety of responses to client.
 */
class ResponseUtils {
  constructor(res, next) {
    this.res = res;
    this.next = next;
  }

  /**
   * Send data response to client
   * @param {(object|object[])} [data] - data to send to client
   */
  data(data) {
    return this.res.json({ data: data || null });
  }

  /**
   * Send error responses to client using status code
   * @param {*} data
   * @param {number} httpStatusCode
   */
  errors(data, httpStatusCode) {
    if (!httpStatusCode) {
      return this.next(new Error('res.errors missing status code'));
    }
    let errors = [];
    if (Array.isArray(data)) {
      errors = data;
    } else {
      errors.push(data);
    }
    // Ensure errors are objects with a title property
    errors = errors.map(e => {
      if (typeof e === 'string') {
        return { title: e };
      }
      if (e instanceof Error) {
        const title = e.message || e.toString();
        return { title };
      }
      if (e.title) {
        return e;
      }
      return { title: 'Something happened' };
    });
    return this.res.status(httpStatusCode).json({ errors });
  }

  /**
   * Send a 404 with an error object
   */
  updateNotFound() {
    return this.errors('Not found', 404);
  }

  /**
   * Send a 200 null data response for get /item/<id> that doesn't exist
   */
  getNotFound() {
    return this.data(null);
  }

  /**
   * Send a 404 with an error object
   */
  deleteNotFound() {
    return this.errors('Not found', 404);
  }

  /**
   * Send a 200 with a meta object
   */
  deleteOk() {
    return this.res.json({ meta: null });
  }
}

module.exports = ResponseUtils;
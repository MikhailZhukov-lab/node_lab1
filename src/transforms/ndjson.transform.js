import { Transform } from 'node:stream';

class NdjsonTransform extends Transform {
  constructor({ mapRecord = null } = {}) {
    super({ objectMode: true });
    this.mapRecord = mapRecord;
  }

  _transform(record, _encoding, callback) {
    try {
      const payload = this.mapRecord ? this.mapRecord(record) : record;
      callback(null, `${JSON.stringify(payload)}\n`);
    } catch (error) {
      callback(error);
    }
  }
}

export { NdjsonTransform };

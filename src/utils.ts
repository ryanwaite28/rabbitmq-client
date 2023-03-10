// https://github.com/Foo-Foo-MQ/foo-foo-mq/blob/main/src/index.js
export const SERIALIZERS = {
  'application/json': {
    deserialize: (bytes, encoding) => {
      return JSON.parse(bytes.toString(encoding || 'utf8'));
    },
    serialize: (object) => {
      const json = (typeof object === 'string')
        ? object
        : JSON.stringify(object);
      return Buffer.from(json, 'utf8');
    }
  },
  'application/octet-stream': {
    deserialize: (bytes) => {
      return bytes;
    },
    serialize: (bytes) => {
      if (Buffer.isBuffer(bytes)) {
        return bytes;
      } else if (Array.isArray(bytes)) {
        return Buffer.from(bytes);
      } else {
        throw new Error('Cannot serialize unknown data type');
      }
    }
  },
  'text/plain': {
    deserialize: (bytes, encoding) => {
      return bytes.toString(encoding || 'utf8');
    },
    serialize: (string) => {
      return Buffer.from(string, 'utf8');
    }
  }
};



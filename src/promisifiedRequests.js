'use strict';

import debug from 'debug';
import {VerifierError} from './config/default';
import fetch from 'cross-fetch';

const log = debug("promisifiedRequests");

export function request(obj) {
  return fetch(obj.url)
    .then((response) => {
      if (!response.ok) throw new Error('Network error: ' + response.statusText);
      return response.text()
    });
};

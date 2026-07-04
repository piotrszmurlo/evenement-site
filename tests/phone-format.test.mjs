import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPhoneDisplay } from '../src/lib/content.ts';

test('formats 9-digit Polish numbers with +48 prefix', () => {
  assert.equal(formatPhoneDisplay('600000000'), '+48 600 000 000');
});

test('keeps +48 prefixed numbers formatted consistently', () => {
  assert.equal(formatPhoneDisplay('+48500111222'), '+48 500 111 222');
});

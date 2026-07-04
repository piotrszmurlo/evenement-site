import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatAreaM2 } from '../src/lib/content.ts';

test('formats area with two decimal places', () => {
  assert.equal(formatAreaM2(119.4), '119,40');
});

test('keeps two decimal places for whole numbers', () => {
  assert.equal(formatAreaM2(120), '120,00');
});

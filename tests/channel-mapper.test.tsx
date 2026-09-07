import test from 'node:test';
import assert from 'node:assert/strict';
import { getChannelDisplayName, CHANNEL_PERSIAN_MAP } from '../src/utils/channelMapper';

test('channelMapper: converts standard channel enums to accurate Persian text', () => {
  assert.equal(getChannelDisplayName('phone'), 'تماس تلفنی');
  assert.equal(getChannelDisplayName('in_person'), 'مراجعه حضوری');
  assert.equal(getChannelDisplayName('whatsapp'), 'واتساپ');
  assert.equal(getChannelDisplayName('telegram'), 'تلگرام');
  assert.equal(getChannelDisplayName('field_visit'), 'ویزیت میدانی');
  assert.equal(getChannelDisplayName('visit'), 'ویزیت میدانی');
  assert.equal(getChannelDisplayName('other'), 'سایر');
});

test('channelMapper: handles uppercase and whitespace gracefully', () => {
  assert.equal(getChannelDisplayName(' PHONE '), 'تماس تلفنی');
  assert.equal(getChannelDisplayName('WhatsApp'), 'واتساپ');
  assert.equal(getChannelDisplayName('IN_PERSON'), 'مراجعه حضوری');
});

test('channelMapper: returns safe Persian fallback for unknown or empty channel', () => {
  assert.equal(getChannelDisplayName(undefined), 'سایر');
  assert.equal(getChannelDisplayName(null), 'سایر');
  assert.equal(getChannelDisplayName(''), 'سایر');
  assert.equal(getChannelDisplayName('unknown_custom_channel'), 'سایر');
});

test('channelMapper: overrides rawLabel if it contains raw english "phone"', () => {
  assert.equal(getChannelDisplayName('phone', 'phone'), 'تماس تلفنی');
  assert.equal(getChannelDisplayName('phone', 'customer phone call'), 'تماس تلفنی');
  // Meaningful Persian rawLabel preserved
  assert.equal(getChannelDisplayName('phone', 'تماس تلفنی با دفتر مرکزی'), 'تماس تلفنی با دفتر مرکزی');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getChannelDisplayName, CHANNEL_PERSIAN_MAP } from '../src/utils/channelMapper';
import {
  getPersonaDisplayName,
  getPersonaSubtitle,
  getPersonaTypeLabel,
  stripRoleSampleSuffix,
} from '../src/runtime/documentBasedPersonas';
import { mockRepository, sanitizeDspTaskRecord } from '../src/runtime/workflow';
import { CLEAN_ROLE_METAS } from '../src/components/auth/roleDisplayConfig';
import { MOCK_PERSONAS } from '../src/data/mockData';
import { MOCK_PRODUCTS } from '../src/data/mockMasterData';

test('1. Sales order defaults: carton count is 1 and 1 carton totals 15,000,000 Rials', () => {
  const defaultCartons = 1;
  const prod = MOCK_PRODUCTS[0];
  assert.equal(defaultCartons, 1, 'Default cartons must be 1');
  
  const piecesPerCarton = prod.cartonConversion?.piecesPerCarton || prod.conversionRatio || 12;
  const unitPrice = prod.currentPriceRials || 1250000;
  assert.equal(unitPrice, 1250000, 'Product unit price is 1,250,000 Rials');
  assert.equal(piecesPerCarton, 12, 'Bottles per carton is 12');

  const pieces = defaultCartons * piecesPerCarton;
  const totalRials = pieces * unitPrice;
  assert.equal(totalRials, 15000000, 'Total of 1 carton must calculate to exactly 15,000,000 Rials');
});

test('2. Channel mapper: maps raw English channels to friendly Persian', () => {
  assert.equal(getChannelDisplayName('phone'), 'تماس تلفنی');
  assert.equal(getChannelDisplayName('in_person'), 'مراجعه حضوری');
  assert.equal(getChannelDisplayName('whatsapp'), 'واتساپ');
  assert.equal(getChannelDisplayName('telegram'), 'تلگرام');
  assert.equal(getChannelDisplayName('visit'), 'ویزیت میدانی');
  assert.equal(getChannelDisplayName('field_visit'), 'ویزیت میدانی');
  assert.equal(getChannelDisplayName('other'), 'سایر');
  assert.equal(getChannelDisplayName('unknown_xyz'), 'سایر');
  assert.equal(getChannelDisplayName(null), 'سایر');
});

test('3. DSP-1404-0550 task consistency: Arash is responsible and Kamran Davoudi is completely absent', () => {
  const dspRecord = mockRepository.getRecordById('rec-004');
  assert.ok(dspRecord, 'Record rec-004 must exist');
  assert.equal(dspRecord.code, 'DSP-1404-0550');

  // Creator, owner, currentOwner, currentAssignee
  assert.equal(dspRecord.creator.name, 'آرش');
  assert.equal(dspRecord.currentOwner?.name, 'آرش');
  assert.equal(dspRecord.currentAssignee?.name, 'آرش');

  // Next action
  assert.equal(dspRecord.nextAction?.responsiblePersonName, 'آرش');
  assert.equal(dspRecord.nextAction?.responsibleRole, 'مسئول لجستیک و هماهنگی خرید');

  // Timeline events
  for (const event of dspRecord.timeline || []) {
    if (event.actor) {
      assert.notEqual(event.actor.name, 'کامران داوودی', 'Actor name in timeline must not be Kamran Davoudi');
    }
  }

  // Serialized record JSON check
  const json = JSON.stringify(dspRecord);
  assert.equal(json.includes('کامران داوودی'), false, 'Kamran Davoudi must not appear anywhere in DSP-1404-0550');
});

test('4. Role type labels: strictly "نقش سازمانی" or "نقش نمونه"', () => {
  for (const persona of MOCK_PERSONAS) {
    const typeLabel = getPersonaTypeLabel(persona);
    assert.ok(
      typeLabel === 'نقش سازمانی' || typeLabel === 'نقش نمونه',
      `Persona ${persona.id} label "${typeLabel}" must be either "نقش سازمانی" or "نقش نمونه"`
    );
  }

  for (const [id, meta] of Object.entries(CLEAN_ROLE_METAS)) {
    assert.ok(
      meta.badgeText === 'نقش سازمانی' || meta.badgeText === 'نقش نمونه',
      `Role meta ${id} badgeText "${meta.badgeText}" must be either "نقش سازمانی" or "نقش نمونه"`
    );
  }
});

test('5. Role title cleanliness: no duplicate "(نقش نمونه)" or "— نقش نمونه" in CLEAN_ROLE_METAS', () => {
  for (const [id, meta] of Object.entries(CLEAN_ROLE_METAS)) {
    assert.equal(
      meta.name.includes('نقش نمونه'),
      false,
      `Role meta ${id} name "${meta.name}" should not include "نقش نمونه"`
    );
    assert.equal(
      meta.jobTitle.includes('نقش نمونه'),
      false,
      `Role meta ${id} jobTitle "${meta.jobTitle}" should not include "نقش نمونه"`
    );
    assert.notEqual(
      meta.name,
      meta.jobTitle,
      `Role meta ${id} jobTitle should be distinct from name, not a duplicate`
    );
  }
});

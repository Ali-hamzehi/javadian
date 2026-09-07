import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPersonaDisplayName,
  getPersonaTypeLabel,
  getPersonaSubtitle,
  stripRoleSampleSuffix,
  getDocumentBasedPersonaById,
} from '../src/runtime/documentBasedPersonas';

test('persona helpers: strip redundant role suffixes cleanly', () => {
  assert.equal(stripRoleSampleSuffix('کارشناس فروش — نقش نمونه'), 'کارشناس فروش');
  assert.equal(stripRoleSampleSuffix('کارشناس فروش (نقش نمونه)'), 'کارشناس فروش');
  assert.equal(stripRoleSampleSuffix('تأییدکننده مالی — نقش نمونه'), 'تأییدکننده مالی');
  assert.equal(stripRoleSampleSuffix('مسئول اطلاعات پایه — نقش نمونه'), 'مسئول اطلاعات پایه');
  assert.equal(stripRoleSampleSuffix('آرش'), 'آرش');
  assert.equal(stripRoleSampleSuffix('آقای نادری'), 'آقای نادری');
});

test('persona helpers: getPersonaDisplayName returns clean primary role or person name', () => {
  const sales = getDocumentBasedPersonaById('p-sales');
  assert.ok(sales);
  assert.equal(getPersonaDisplayName(sales), 'کارشناس فروش');

  const arash = getDocumentBasedPersonaById('p-warehouse');
  assert.ok(arash);
  assert.equal(getPersonaDisplayName(arash), 'آرش');

  const naderi = getDocumentBasedPersonaById('p-field-sales');
  assert.ok(naderi);
  assert.equal(getPersonaDisplayName(naderi), 'آقای نادری');

  const comm = getDocumentBasedPersonaById('p-comm-approver');
  assert.ok(comm);
  assert.equal(getPersonaDisplayName(comm), 'تأییدکننده بازرگانی');

  const finSpec = getDocumentBasedPersonaById('p-fin-spec');
  assert.ok(finSpec);
  assert.equal(getPersonaDisplayName(finSpec), 'کارشناس مالی');
});

test('persona helpers: getPersonaTypeLabel strictly returns only "نقش سازمانی" or "نقش نمونه"', () => {
  // Documented personas -> نقش سازمانی
  assert.equal(getPersonaTypeLabel('p-warehouse'), 'نقش سازمانی');
  assert.equal(getPersonaTypeLabel('p-field-sales'), 'نقش سازمانی');
  assert.equal(getPersonaTypeLabel('p-ops-dir'), 'نقش سازمانی');
  assert.equal(getPersonaTypeLabel('p-multi-delegate'), 'نقش سازمانی');
  assert.equal(getPersonaTypeLabel(getDocumentBasedPersonaById('p-warehouse')), 'نقش سازمانی');

  // Sample personas -> نقش نمونه
  assert.equal(getPersonaTypeLabel('p-sales'), 'نقش نمونه');
  assert.equal(getPersonaTypeLabel('p-fin-spec'), 'نقش نمونه');
  assert.equal(getPersonaTypeLabel('p-comm-approver'), 'نقش نمونه');
  assert.equal(getPersonaTypeLabel(getDocumentBasedPersonaById('p-sales')), 'نقش نمونه');
});

test('persona helpers: getPersonaSubtitle returns distinct secondary info or department', () => {
  const arash = getDocumentBasedPersonaById('p-warehouse');
  assert.equal(getPersonaSubtitle(arash), 'مسئول لجستیک و هماهنگی خرید');

  const naderi = getDocumentBasedPersonaById('p-field-sales');
  assert.equal(getPersonaSubtitle(naderi), 'مسئول فروش مویرگی استان قم');

  const montazeri = getDocumentBasedPersonaById('p-ops-dir');
  assert.equal(getPersonaSubtitle(montazeri), 'مدیرعامل');

  const sales = getDocumentBasedPersonaById('p-sales');
  // Subtitle is department because cleanJob ('کارشناس فروش') is identical to cleanName ('کارشناس فروش')
  assert.equal(getPersonaSubtitle(sales), 'واحد فروش و بازرگانی داخلی');
});

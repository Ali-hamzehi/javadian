import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormField, TextInput, SelectInput, TextareaInput, Switch } from '../src/components/design-system/FormControls';
import { FieldGroup } from '../src/components/design-system/FieldGroup';
import { Button } from '../src/components/design-system/Button';
import { AdaptiveTable } from '../src/components/design-system/AdaptiveTable';
import { StatusBadge } from '../src/components/design-system/Badges';
import { Avatar } from '../src/components/design-system/Avatar';
import { DialogSurface } from '../src/components/design-system/DialogSurface';
const html = (node: React.ReactNode) => renderToStaticMarkup(node);

test('shared field label, required state and error point to the same input', () => {
  const out = html(<FormField label="مبلغ" error="مبلغ را وارد کنید" required><TextInput /></FormField>);
  const id = out.match(/<label[^>]*for="([^"]+)"/)![1];
  assert.ok(out.includes(`id="${id}"`));
  assert.ok(out.includes(`aria-describedby="${id}-error"`));
  assert.ok(out.includes(`id="${id}-error"`));
  assert.ok(out.includes('aria-invalid="true"'));
  assert.ok(out.includes('aria-required="true"'));
});
test('explicit child IDs cannot disconnect reusable field labels', () => {
  for (const child of [<TextInput id="legacy" />, <SelectInput id="legacy" options={[]} />, <TextareaInput id="legacy" />]) {
    const out=html(<FormField label="آزمون">{child}</FormField>);
    const id=out.match(/<label[^>]*for="([^"]+)"/)![1];
    assert.ok(out.includes(`id="${id}"`));
  }
});
test('native wrapped fields have unique IDs and retain values', () => {
  const out = html(<><FieldGroup><label>نام</label><div><input defaultValue="جوادیان" /></div></FieldGroup><FieldGroup><label>شرح</label><textarea defaultValue="شرح نمونه" /></FieldGroup></>);
  const labels = [...out.matchAll(/<label[^>]*for="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(labels).size, 2);
  for (const id of labels) assert.ok(out.includes(`id="${id}"`));
  assert.ok(out.includes('جوادیان')); assert.ok(out.includes('شرح نمونه'));
});
test('loading button retains its name and communicates busy + disabled', () => {
  const out=html(<Button isLoading>ثبت درخواست</Button>);
  assert.ok(out.includes('ثبت درخواست')); assert.ok(out.includes('aria-busy="true"')); assert.ok(out.includes('disabled=""'));
});
test('switch is keyboard-operable native button with state', () => {
  const out=html(<Switch checked onChange={()=>{}} label="فعال" />);
  assert.ok(out.startsWith('<button')); assert.ok(out.includes('role="switch"')); assert.ok(out.includes('aria-checked="true"'));
});
test('adaptive table preserves every value and assigns mobile labels, not invented fields', () => {
  const out=html(<AdaptiveTable><thead><tr><th>شماره</th><th>مسئول</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody><tr><td>ORD-123</td><td>مسئول نمونه</td><td>120000</td><td>NOT_CONNECTED</td></tr><tr><td colSpan={4}>شرح سند</td></tr></tbody></AdaptiveTable>);
  for(const label of ['شماره','مسئول','مبلغ','وضعیت'])assert.ok(out.includes(`data-label="${label}"`));
  for(const value of ['ORD-123','مسئول نمونه','120000','NOT_CONNECTED','شرح سند'])assert.ok(out.includes(value));
  assert.ok(out.includes('<table')); assert.ok(out.includes('colSpan="4"'));
});
test('integration and prototype states remain separately named and machine-readable', () => {
  for(const status of ['DEFERRED','NOT_CONNECTED','NOT_CONFIGURED','NOT_POSTED','PROTOTYPE_ONLY']){
    const out=html(<StatusBadge status={status} />);
    assert.ok(out.includes(`data-status="${status}"`)); assert.ok(out.includes(`<bdi dir="ltr">${status}</bdi>`));
    assert.ok(!out.includes('پیش‌نویس اولیه'));
  }
});
test('dialog is native, named, and only mounted when open (focus needs browser QA)', () => {
  assert.equal(html(<DialogSurface isOpen={false} onClose={()=>{}} title="آزمون">بدنه</DialogSurface>),'');
  const out=html(<DialogSurface isOpen onClose={()=>{}} title="آزمون">بدنه</DialogSurface>);
  assert.ok(out.startsWith('<dialog')); assert.ok(out.includes('aria-labelledby=')); assert.ok(out.includes('آزمون'));
});
test('persona display cannot request a remote avatar',()=>{
  const out=html(<Avatar src="https://example.invalid/avatar.png" alt="حساب نمونه" />);
  assert.ok(!out.includes('<img')); assert.ok(!out.includes('example.invalid')); assert.ok(out.includes('حساب نمونه'));
});

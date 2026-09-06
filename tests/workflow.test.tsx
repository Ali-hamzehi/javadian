import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { mockSalesWarehouseStore as sales, mockRepository as repo, mockSupplyReceiptStore as supply, subscribeWorkflow, getPayments, setPayments, decidePayment } from '../src/runtime/workflow';
import { MOCK_PERSONAS } from '../src/data/mockData';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS } from '../src/data/mockMasterData';
import { parseFinancialInput, moneyWords, validRials } from '../src/utils/financial';
import { rialsToToman, formatToman } from '../src/utils/currencyUtils';
import { IranianPlate } from '../src/components/design-system/IranianPlate';
import { getProductSupportedUnits } from '../src/views/SupplyRequestsView';
import { daysUntilDue } from '../src/components/design-system/PaymentSchedule';
import { computeAllowedActions } from '../src/utils/workItemAuthorization';
const creator = MOCK_PERSONAS.find(p => p.personaKey === 'sales_specialist')!;
const approver = MOCK_PERSONAS.find(p => p.personaKey === 'commercial_approver')!;
const product = MOCK_PRODUCTS[0];
function newOrder(price: number) {
 return sales.createSalesOrder({customerId: MOCK_CUSTOMERS[0].id, channel:'phone',creatorPersona:creator,salesResponsibleId:creator.id,salesResponsibleName:creator.name,deliveryAddress:'آزمون',paymentTerms:'نقدی',deliveryTerms:'انبار',items:[{productId:product.id,productName:product.name,unit:product.baseUnit,conversionFactor:12,cartons:1,pieces:12,weightKg:16.5,baseUnit:product.baseUnit,dailyReferencePriceRials:product.currentPriceRials,minPermittedPriceRials:product.minAllowedPriceRials,offeredPriceRials:price,agreedUnitPriceRials:price,discountPercent:0}]});
}
test('ordinary and exceptional orders both reach creator and independent approver; approval is once only', () => {
 for (const price of [product.currentPriceRials, product.minAllowedPriceRials - 100]) {
  const order = newOrder(price); const item = repo.getRecordById(order.linkedWorkItemId!)!;
  assert.ok(item); assert.equal(item.linkedBusinessRecord?.id,order.id);
  assert.ok(repo.getAuthorizedRecords(creator).some(r=>r.id===item.id));
  assert.ok(repo.getActionableApprovalItems(approver).some(r=>r.id===item.id));
  assert.equal(computeAllowedActions(creator,item).can_approve,false);
  assert.equal(computeAllowedActions(approver,item).can_approve,true);
  assert.equal(sales.approveSalesOrder(order.id,creator).success,false);
  const before=sales.getWarehouseExits().length;
  assert.equal(sales.approveSalesOrder(order.id,approver).success,true);
  assert.equal(repo.isActionableApprovalRecord(approver,item),false);
  const after=sales.getWarehouseExits().length; assert.ok(after>before);
  assert.equal(sales.approveSalesOrder(order.id,approver).success,false);
  assert.equal(sales.getWarehouseExits().length,after);
 }
});
test('repository changes broadcast to mounted consumers and unsubscribe works',()=>{
 let changes=0; const stop=subscribeWorkflow(()=>changes++);
 const order=newOrder(product.currentPriceRials);
 assert.ok(changes>0); changes=0;
 repo.addComment(order.linkedWorkItemId!,creator.name,'پیگیری',false);
 assert.ok(changes>0); stop(); const before=changes;
 repo.addComment(order.linkedWorkItemId!,creator.name,'پیگیری بعدی',false);
 assert.equal(changes,before);
});
test('payment decisions update shared source, route to treasury, block self approval and repeats',()=>{
 const payment=structuredClone(getPayments().find(p=>p.approver.id!==p.requester.id)!);
 payment.id='payment-workflow-test';payment.code='PAY-WORKFLOW';payment.status='submitted';
 const template=repo.getAllRecords()[0];
 repo.addRecord({...structuredClone(template),id:'wi-payment-test',code:'WI-PAY-TEST',creator:payment.requester,approvalInstance:undefined,linkedBusinessRecord:{id:payment.id,code:payment.code,title:payment.purpose,category:'payment_request',categoryLabel:'پرداخت',currentStatus:'submitted',summary:payment.purpose}});
 setPayments(previous=>[...previous,payment]);
 const record=repo.getRecordById('wi-payment-test')!;
 const actor=MOCK_PERSONAS.find(p=>p.id===payment.approver.id)!;
 assert.ok(actor);assert.equal(repo.isActionableApprovalRecord(actor,record),true);
 assert.equal(decidePayment(record.id,payment.requester.id,'approved'),false);
 assert.equal(decidePayment(record.id,actor.id,'approved','تأیید آزمون'),true);
 assert.equal(getPayments().find(p=>p.id===payment.id)?.status,'approved');
 assert.equal(record.currentAssignee?.id,payment.executor.id);assert.equal(record.status,'in_progress');
 assert.equal(repo.isActionableApprovalRecord(actor,record),false);
 assert.equal(decidePayment(record.id,actor.id,'approved'),false);
});
test('supply cannot claim completion with shortages; completed delivery updates inbox',()=>{
 const {supplyRequest:request,workItem}=supply.createSupplyRequest({title:'آزمون تحویل',triggerType:'operational_need',triggerDescription:'کنترل',creatorPersona:creator,requiredDateJalali:'۱۴۰۵/۰۶/۲۰',priority:'normal',reason:'آزمون',items:[{productId:product.id,quantity:3,unit:'کارتن',conversionFactor:12,estimatedPrice:1000}]});
 const id=request.items[0].id;
 assert.equal(supply.updateSupplyResult(request.id,{[id]:-1},'supplied_partial',''),false);
 assert.equal(supply.updateSupplyResult(request.id,{[id]:4},'supplied_complete',''),false);
 assert.equal(supply.updateSupplyResult(request.id,{[id]:2},'supplied_complete',''),false);
 assert.equal(supply.updateSupplyResult(request.id,{[id]:2},'supplied_partial',''),true);
 assert.equal(request.items[0].remainingQuantity,1);
 assert.equal(supply.updateSupplyResult(request.id,{[id]:3},'supplied_complete',''),true);
 assert.equal(request.items[0].remainingQuantity,0);assert.equal(repo.getRecordById(workItem!.id)?.status,'completed');
});
test('financial inputs preserve Rial remainder, Persian digits and safe integer validation',()=>{
 assert.equal(parseFinancialInput('۲۵۰٬۰۰۰٬۰۰۱'),250000001);
 assert.equal(parseFinancialInput('١٢٣'),123);
 assert.equal(rialsToToman(11),1.1);assert.ok(formatToman(11).includes('۱٫۱'));
 assert.ok(moneyWords(11).includes('یک تومان و یک ریال'));
 assert.equal(validRials(NaN),false); assert.equal(validRials(1.5),false); assert.equal(validRials(0),false);
});
test('weight conversion expresses base units per kg, not kg per base unit',()=>{
 const kg=getProductSupportedUnits(product).find(u=>u.unit==='کیلوگرم');
 if(product.baseUnit!=='کیلوگرم' && kg) assert.equal(kg.conversionFactor,product.conversionRatio/product.cartonConversion.kgPerCarton);
});
test('missing and invalid plates never invent a real registration',()=>{
 const blank=renderToStaticMarkup(<IranianPlate plateString="---"/>);assert.ok(blank.includes('پلاک ثبت نشده'));assert.ok(!blank.includes('۸۵۰'));
 const reverse=renderToStaticMarkup(<IranianPlate plateString="ایران ۳۳ - ۲۲۱ ع ۵۵"/>);assert.ok(reverse.includes('۲۲۱'));assert.ok(reverse.includes('۵۵'));
});
test('due dates use actual calendar days and reject invalid calendar values',()=>{
 const now=new Date(2026,8,6,23,59);assert.equal(daysUntilDue('2026-09-06',now),0);assert.equal(daysUntilDue('2026-09-09',now),3);assert.equal(daysUntilDue('2026-09-05',now),-1);assert.equal(daysUntilDue('2026-02-31',now),null);
});
test('returned orders produce a current approval revision and retire the previous inbox record',()=>{
 const order=newOrder(product.currentPriceRials);const previous=repo.getRecordById(order.linkedWorkItemId!)!;
 assert.equal(sales.returnSalesOrder(order.id,approver,'اصلاح شرایط').success,true);
 assert.equal(sales.reviseSalesOrder(order.id,creator,{paymentTerms:'نقد پس از تأیید'},'اصلاح شرایط'),true);
 const current=repo.getRecordById(order.linkedWorkItemId!)!;
 assert.notEqual(current.id,previous.id);
 assert.ok(current.code.includes(order.code));
 assert.equal(repo.isActionableApprovalRecord(approver,previous),false);
 assert.equal(repo.isActionableApprovalRecord(approver,current),true);
 assert.ok(repo.getActionableApprovalItems(approver).some(r=>r.id===current.id));
});

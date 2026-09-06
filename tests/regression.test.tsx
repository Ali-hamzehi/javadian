import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { MOCK_PERSONAS } from '../src/data/mockData';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../src/data/mockMasterData';
import { mockSalesWarehouseStore, CreateSalesOrderPayload } from '../src/data/mockSalesWarehouseStore';
import { mockSupplyReceiptStore, CreateSupplyRequestPayload } from '../src/data/mockSupplyReceiptStore';
import { mockRepository } from '../src/data/mockRepository';
import { canAccessRoute } from '../src/routes/routesConfig';
import { MobileBottomNav } from '../src/components/shell/MobileBottomNav';
import { WarehouseReceiptsView } from '../src/views/WarehouseReceiptsView';
import { PaymentRequestsView } from '../src/views/PaymentRequestsView';
import { ProductCatalogView } from '../src/views/ProductCatalogView';
import { InboxView } from '../src/views/InboxView';
import { SalesView } from '../src/views/SalesView';
import { SupplyRequestsView } from '../src/views/SupplyRequestsView';
import { ToastProvider } from '../src/components/design-system/ToastContext';
import { PWAProvider } from '../src/components/pwa/PWAContext';

const creator=MOCK_PERSONAS.find(p=>p.personaKey==='sales_specialist')!;
const approver=MOCK_PERSONAS.find(p=>p.personaKey==='commercial_approver')!;
const product=MOCK_PRODUCTS[0];

test('protected business sources, IDs, permissions, lockfile, fonts and SW stay byte-identical',()=>{
  const hashes=JSON.parse(fs.readFileSync('docs/PROTECTED_SOURCE_SHA256.json','utf8')) as Record<string,string>;
  for(const [file, expected] of Object.entries(hashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),expected,file);
});
test('below-minimum price retains quantities, reference price and independent approval',()=>{
  const price=product.effectivePrice!;
  const payload: CreateSalesOrderPayload={customerId:MOCK_CUSTOMERS[0].id,channel:'phone',creatorPersona:creator,salesResponsibleId:creator.id,salesResponsibleName:creator.name,deliveryAddress:'نشانی نمایشی آزمون',paymentTerms:'نقدی',deliveryTerms:'تحویل نمایشی',items:[{productId:product.id,productName:product.name,unit:'کارتن',conversionFactor:12,cartons:2,pieces:24,weightKg:36,baseUnit:product.baseUnit,dailyReferencePriceRials:price.referencePriceRials,minPermittedPriceRials:price.minPermittedPriceRials,offeredPriceRials:1100000,agreedUnitPriceRials:1100000,discountPercent:12}]};
  const order=mockSalesWarehouseStore.createSalesOrder(payload);
  assert.equal(order.status,'needs_price_approval'); assert.equal(order.totalAmountRials,26400000);
  assert.equal(order.items[0].pieces,24); assert.equal(order.items[0].cartons,2);
  assert.equal(order.items[0].officialSnapshotPriceRials,1250000);
  assert.ok(order.linkedWorkItemId); assert.equal(mockRepository.getRecordById(order.linkedWorkItemId!)?.status,'pending_approval');
  assert.equal(mockSalesWarehouseStore.approveSalesOrder(order.id,creator).success,false);
  assert.equal(order.status,'needs_price_approval');
  const ordinary=MOCK_PERSONAS.find(p=>p.personaKey==='ordinary_employee')!;
  assert.equal(mockSalesWarehouseStore.approveSalesOrder(order.id,ordinary).success,false);
  assert.equal(mockSalesWarehouseStore.approveSalesOrder(order.id,approver,'تأیید نمایشی آزمون').success,true);
  assert.equal(order.status,'approved');
});
test('submitted supply request links to WorkItem with unchanged quantity and amount',()=>{
  const payload: CreateSupplyRequestPayload={title:'آزمون پیوند تأمین',triggerType:'operational_need',triggerDescription:'سناریوی نمایشی',creatorPersona:creator,requiredDateJalali:'۱۴۰۴/۰۶/۲۰',priority:'normal',reason:'کنترل رگرسیون',items:[{productId:product.id,quantity:3,unit:'کارتن',conversionFactor:12,estimatedPrice:1000}]};
  const {supplyRequest:req,workItem}=mockSupplyReceiptStore.createSupplyRequest(payload);
  assert.ok(workItem); assert.equal(req.linkedWorkItemId,workItem.id);
  assert.equal(workItem.linkedBusinessRecord?.id,req.id); assert.equal(workItem.workRelation?.source_id,req.code);
  assert.equal(mockRepository.getRecordById(workItem.id)?.id,workItem.id);
  assert.equal(req.items[0].baseUnitEquivalent,36); assert.equal(req.estimatedTotalAmountRials,3000);
  const draft=mockSupplyReceiptStore.createSupplyRequest({...payload,title:'پیش‌نویس آزمون'},true);
  assert.equal(draft.supplyRequest.status,'draft'); assert.equal(draft.workItem,undefined); assert.equal(draft.supplyRequest.currentAssignee,undefined);
});
test('mobile navigation has at most five unique eligible destinations for every persona',()=>{
  for(const persona of MOCK_PERSONAS){
    const out=render(<MobileBottomNav currentRoute="inbox" onNavigate={()=>{}} onOpenMore={()=>{}} activePersona={persona} />);
    const buttons=[...out.matchAll(/<button\b/g)]; assert.ok(buttons.length<=5,persona.name);
    const labels=[...out.matchAll(/<span class="text-caption mt-1[^>]*>(.*?)<\/span>/g)].map(m=>m[1]);
    assert.equal(labels.length,new Set(labels).size,persona.name);
    assert.ok(out.includes('بیشتر'));
    if(!canAccessRoute('sales_orders',persona)){assert.ok(!labels.includes('فروش'));assert.ok(!labels.includes('سفارشات'));}
  }
});
test('key initial screens render for all accepted personas; deferred and finance notices remain',()=>{
  const admin=MOCK_PERSONAS[0];
  for(const persona of MOCK_PERSONAS){
    assert.ok(render(<ToastProvider><InboxView activePersona={persona} /></ToastProvider>).length>100);
  }
  for(const view of [<ProductCatalogView currentSubRoute="products" activePersona={admin} />,<SalesView subRoute="sales_orders" activePersona={admin} />,<SupplyRequestsView activePersona={admin} />]){
    assert.ok(render(<ToastProvider>{view}</ToastProvider>).length>100);
  }
  const warehouse=render(<ToastProvider><WarehouseReceiptsView activePersona={admin} /></ToastProvider>);
  for(const marker of ['DEFERRED','NOT_CONNECTED','PROTOTYPE_ONLY'])assert.ok(warehouse.includes(marker));
  const payment=render(<ToastProvider><PaymentRequestsView activePersona={admin} /></ToastProvider>);
  assert.ok(payment.includes('ثبت نشده در سیستم مالی'));
});
test('SW denies business requests, cross-origin, queries, authorization and non-GET; updates require consent',async()=>{
  for(const file of ['public/service-worker.js','public/service-worker-v1.2.0.js']){
    const handlers:Record<string,(event:any)=>void>={};let skips=0,puts=0;
    const context=vm.createContext({URL,Response,console,self:{location:{origin:'https://erp.test'},addEventListener:(name:string,fn:any)=>handlers[name]=fn,skipWaiting:()=>skips++,clients:{claim:()=>{}}},caches:{match:async()=>undefined,open:async()=>({put:()=>puts++,addAll:async()=>{}}),keys:async()=>[]},fetch:async()=>({status:200,type:'basic',headers:new Headers(),clone:()=>({})})});
    vm.runInContext(fs.readFileSync(file,'utf8'),context);
    for(const suffix of ['/api/orders','/assets/customer.svg','/assets/app.js?record=1','/warehouse/receipt','/payment/1']){
      let intercepted=false;
      handlers.fetch({request:{url:'https://erp.test'+suffix,method:'GET',mode:'cors',destination:'script',headers:new Headers()},respondWith:()=>intercepted=true});
      assert.equal(intercepted,false,suffix);
    }
    for(const extra of [{method:'POST'},{url:'https://other.test/assets/app.js'},{headers:new Headers({Authorization:'demo-only'})}]){
      let intercepted=false;
      handlers.fetch({request:{url:'https://erp.test/assets/app.js',method:'GET',mode:'cors',destination:'script',headers:new Headers(),...extra},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
    }
    let staticResponse:Promise<any>|undefined;
    handlers.fetch({request:{url:'https://erp.test/assets/app.js',method:'GET',mode:'cors',destination:'script',headers:new Headers()},respondWith:(p:Promise<any>)=>staticResponse=p});
    assert.ok(staticResponse); await staticResponse; assert.equal(puts,1);
    assert.equal(skips,0);handlers.message({data:{type:'SKIP_WAITING'}});assert.equal(skips,1);
    assert.ok(!handlers.sync);
  }
});

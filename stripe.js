const enc=new TextEncoder();
function hex(buffer){return [...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function safeEqual(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function verify(payload,header,secret){
 const fields=Object.fromEntries((header||'').split(',').map(x=>x.split('=',2)));
 const t=Number(fields.t);if(!Number.isFinite(t)||Math.abs(Date.now()/1000-t)>300)return false;
 const signatures=(header||'').split(',').filter(s=>s.startsWith('v1=')).map(s=>s.slice(3));
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const sig=hex(await crypto.subtle.sign('HMAC',key,enc.encode(`${t}.${payload}`)));
 return signatures.some(s=>safeEqual(s,sig));
}
export async function onRequestPost({request,env}){
 if(!env.STRIPE_WEBHOOK_SECRET)return new Response('Not configured',{status:503});
 const raw=await request.text();if(!await verify(raw,request.headers.get('stripe-signature'),env.STRIPE_WEBHOOK_SECRET))return new Response('Invalid signature',{status:400});
 const event=JSON.parse(raw);
 if(!['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))return new Response('ok');
 const session=event.data.object;
 if(session.payment_status!=='paid')return new Response('ok');
 let items;try{items=JSON.parse(session.metadata.items)}catch{return new Response('Missing order metadata',{status:400})}
 // One database batch is atomic. Duplicate webhooks use INSERT OR IGNORE, then conditional stock updates.
 const existing=await env.DB.prepare('SELECT session_id FROM orders WHERE session_id=?').bind(session.id).first();
 if(existing)return new Response('ok');
 // IMPORTANT: This starter checks stock before checkout but does not reserve it. Concurrent sales may sell out.
 // In that case log a stock_issue order for manual refund / fulfilment resolution, rather than decrementing below 0.
 const statements=[env.DB.prepare('INSERT OR IGNORE INTO orders(session_id,email,amount_total,currency,status,items_json) VALUES(?,?,?,?,?,?)').bind(session.id,session.customer_details?.email||null,session.amount_total||null,session.currency||'aud','paid',JSON.stringify(items))];
 for(const item of items)statements.push(env.DB.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?').bind(item.quantity,item.id,item.quantity));
 const results=await env.DB.batch(statements);
 // Each update reports whether stock changed. A sold-out item is flagged for manual resolution.
 if(results.slice(1).some(r=>r.meta.changes!==1))await env.DB.prepare("UPDATE orders SET status='stock_issue' WHERE session_id=?").bind(session.id).run();
 return new Response('ok');
}

export async function onRequestPost({request,env}) {
 if(!env.STRIPE_SECRET_KEY) return Response.json({error:'Stripe is not configured'},{status:503});
 let body;try{body=await request.json()}catch{return Response.json({error:'Invalid JSON'},{status:400})}
 const items=body?.items;
 if(!Array.isArray(items)||items.length<1||items.length>5)return Response.json({error:'Invalid cart'},{status:400});
 const unique=new Set();const lineItems=[];const ordered=[];
 for(const item of items){
  if(typeof item?.id!=='string'||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>20||unique.has(item.id))return Response.json({error:'Invalid cart item'},{status:400});
  unique.add(item.id);
  const product=await env.DB.prepare('SELECT * FROM products WHERE id=? AND active=1').bind(item.id).first();
  if(!product||product.stock<item.quantity)return Response.json({error:`Out of stock: ${item.id}`},{status:409});
  lineItems.push({price_data:{currency:'aud',unit_amount:product.price_cents,product_data:{name:product.name}},quantity:item.quantity});
  ordered.push({id:product.id,quantity:item.quantity,price_cents:product.price_cents});
 }
 const url=new URL(request.url);const params=new URLSearchParams();
 params.set('mode','payment');params.set('success_url',`${url.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);params.set('cancel_url',`${url.origin}/cancel.html`);
 params.set('billing_address_collection','required');
 // For physical orders, configure shipping countries/rates and collect addresses before going live.
 if(JSON.stringify(ordered).length>500)return Response.json({error:'Cart too large for this demo'},{status:400});
 params.set('metadata[items]',JSON.stringify(ordered));
 lineItems.forEach((item,i)=>{params.set(`line_items[${i}][price_data][currency]`,item.price_data.currency);params.set(`line_items[${i}][price_data][unit_amount]`,String(item.price_data.unit_amount));params.set(`line_items[${i}][price_data][product_data][name]`,item.price_data.product_data.name);params.set(`line_items[${i}][quantity]`,String(item.quantity))});
 const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});
 const session=await response.json();
 if(!response.ok||!session.url)return Response.json({error:'Payment provider error'},{status:502});
 return Response.json({url:session.url});
}

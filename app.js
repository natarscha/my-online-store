const money = cents => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(cents/100);
const cart = new Map(); let products = [];
const productNode = document.querySelector('#products'), cartNode = document.querySelector('#cart'),totalNode = document.querySelector('#total'),message = document.querySelector('#message'),checkout = document.querySelector('#checkout');
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 productNode.innerHTML=products.map(p=>`<article class="product"><div class="image">${p.image_url?`<img loading="lazy" src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}">`:'◇'}</div><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description)}</p><p class="price">${money(p.price_cents)}</p><p><small>${p.stock?`${p.stock} available`:'Sold out'}</small></p><button data-add="${escapeHTML(p.id)}" ${p.stock?'':'disabled'}>Add to cart</button></article>`).join('');
 let sum=0;const rows=[];for(const [id,qty] of cart){const p=products.find(x=>x.id===id);if(!p)continue;sum+=p.price_cents*qty;rows.push(`<p>${escapeHTML(p.name)} × ${qty} — ${money(p.price_cents*qty)} <button data-remove="${escapeHTML(id)}">Remove one</button></p>`)}
 cartNode.innerHTML=rows.join('')||'Your cart is empty.';totalNode.textContent=rows.length?`Subtotal: ${money(sum)} (shipping calculated at checkout)`:'';checkout.disabled=!rows.length;
}
productNode.addEventListener('click',e=>{const id=e.target.dataset.add;if(!id)return;const p=products.find(x=>x.id===id);if(p&& (cart.get(id)||0)<p.stock){cart.set(id,(cart.get(id)||0)+1);render()}});
cartNode.addEventListener('click',e=>{const id=e.target.dataset.remove;if(!id)return;const next=(cart.get(id)||0)-1;if(next>0)cart.set(id,next);else cart.delete(id);render()});
checkout.addEventListener('click',async()=>{checkout.disabled=true;message.textContent='Preparing secure checkout…';try{const response=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[...cart].map(([id,quantity])=>({id,quantity}))})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Checkout unavailable');location.assign(data.url)}catch(e){message.textContent=e.message;checkout.disabled=false}});
try{const response=await fetch('/api/products');if(!response.ok)throw Error('Could not load products');products=await response.json();render()}catch(e){productNode.textContent=e.message}

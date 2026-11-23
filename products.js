export async function onRequestGet({env}) {
 const {results}=await env.DB.prepare('SELECT id,name,description,price_cents,image_url,stock FROM products WHERE active = 1 ORDER BY name').all();
 return Response.json(results,{headers:{'Cache-Control':'no-store'}});
}

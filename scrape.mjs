// Actualiza los precios de data/promos.json. Las promos semanales (promos[]) se editan a mano.
// Node 20+ (fetch incluido). Verificá que cada URL base use VTEX; si no, hay que escribir otro adaptador.
import { readFileSync, writeFileSync } from 'node:fs';

const F = 'data/promos.json';
const BASE = {
  tata: 'https://www.tata.com.uy',
  disco: 'https://www.disco.com.uy',
  el_dorado: 'https://www.eldorado.com.uy',
  // tienda_inglesa: no usa VTEX, falta escribir su adaptador
};

const d = JSON.parse(readFileSync(F, 'utf8'));

async function vtex(base, q) {
  const r = await fetch(
    `${base}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(q)}&_from=0&_to=0`,
    { headers: { 'user-agent': 'Mozilla/5.0' } }
  );
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const o = (await r.json())[0]?.items?.[0]?.sellers?.[0]?.commertialOffer;
  return o?.Price ? { p: o.Price, l: o.ListPrice || o.Price } : null;
}

for (const p of d.products) {
  for (const [s, base] of Object.entries(BASE)) {
    try {
      const x = await vtex(base, p.q);
      if (x) p.prices[s] = x;
    } catch (e) {
      console.warn(p.name, s, e.message); // si falla, se conserva el precio anterior
    }
  }
}

d.meta = { ...d.meta, updated: new Date().toISOString().slice(0, 10) };
writeFileSync(F, JSON.stringify(d, null, 1));

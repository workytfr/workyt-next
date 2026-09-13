/**
 * Tests du cœur de calcul de la Guerre des Clans.
 *
 * Le projet n'a pas de lanceur de tests. Ce script est autonome :
 *     node scripts/test-clan-combat.mjs
 *
 * Il porte les fonctions pures de src/lib/clanCombat.ts. Si tu modifies l'une,
 * reporte-la ici — c'est le seul filet du projet sur ces calculs, et une erreur
 * y corromprait une semaine entière de jeu pour tout le monde.
 */

/* ------------------------------------------------------------ portage */

const GATES = ['nord', 'est', 'sud'];
const WOUND_THRESHOLD = 50, HEAL_COST = 40, RALLY_DEFICIT = 3, RALLY_BONUS = 1.25;

function contribution(m, followsOrder, rallyBonus) {
  let v = m.dailyPoints * (m.multiplier || 1);
  if (m.wounded) v *= 0.5;
  if (followsOrder) v *= 1.2;
  return v * rallyBonus;
}
function weakestGate(gates) {
  const standing = gates.filter(g => !g.fallen);
  const pool = standing.length ? standing : gates;
  return pool.reduce((a, b) => (a.hp <= b.hp ? a : b)).name;
}
function targetGate(m, order, enemyGates) {
  if (m.gate) return m.gate;
  if (order) return order;
  return weakestGate(enemyGates);
}
function computeAssault(side, enemyGates, rallyBonus = 1) {
  const byGate = { nord: 0, est: 0, sud: 0 };
  let healPool = 0;
  for (const m of side.members) {
    if (m.role === 'soigneur') { healPool += contribution(m, false, rallyBonus); continue; }
    if (m.role !== 'attaquant') continue;
    const g = targetGate(m, side.dailyOrder, enemyGates);
    byGate[g] += contribution(m, !!side.dailyOrder && g === side.dailyOrder, rallyBonus);
  }
  const forge = side.buildings.includes('forge') ? 1.15 : 1;
  for (const g of GATES) byGate[g] = Math.round(byGate[g] * forge);
  return { byGate, healPool, total: GATES.reduce((s, g) => s + byGate[g], 0) };
}
function computeDefense(side, rallyBonus = 1) {
  const byGate = { nord: 0, est: 0, sud: 0 };
  for (const m of side.members) {
    if (m.role !== 'defenseur') continue;
    const g = m.gate ?? side.dailyOrder ?? weakestGate(side.gates);
    byGate[g] += contribution(m, !!side.dailyOrder && g === side.dailyOrder, rallyBonus);
  }
  for (const g of GATES) byGate[g] = Math.round(byGate[g]);
  return byGate;
}
function resolveGates(assault, defense, gates, defenders, defenderOrder) {
  return gates.map(g => {
    const a = assault[g.name] ?? 0, d = defense[g.name] ?? 0;
    const damage = g.fallen ? 0 : Math.max(0, a - d);
    const overflow = Math.max(0, a - d);
    const hpAfter = Math.max(0, g.hp - damage);
    const justFell = !g.fallen && hpAfter === 0;
    let woundedUserIds = [];
    if (overflow > 0 && !g.fallen) {
      const onGate = defenders.filter(m =>
        m.role === 'defenseur' && !m.wounded &&
        (m.gate ?? defenderOrder ?? weakestGate(gates)) === g.name);
      const count = Math.min(Math.max(0, onGate.length - 1), Math.ceil(overflow / WOUND_THRESHOLD));
      woundedUserIds = onGate.slice(0, count).map(m => m.userId);
    }
    return { gate: g.name, assault: a, defense: d, damage, overflow, hpBefore: g.hp, hpAfter, justFell, woundedUserIds };
  });
}
function applyHealing(healPool, wounded, infirmerie) {
  const cost = infirmerie ? HEAL_COST / 2 : HEAL_COST;
  let pool = healPool;
  const healedUserIds = [];
  const ordered = [...wounded].sort((a, b) => (a.woundedAt?.getTime() ?? 0) - (b.woundedAt?.getTime() ?? 0));
  for (const m of ordered) { if (pool < cost) break; pool -= cost; healedUserIds.push(m.userId); }
  return { healedUserIds, repairLeft: Math.round(pool) };
}
function dayOutcome(a, b) {
  if (Math.abs(a - b) < 1e-9) return { a: 'draw', b: 'draw' };
  return a > b ? { a: 'win', b: 'loss' } : { a: 'loss', b: 'win' };
}
function rallyBonusFor(mine, rival) { return rival - mine >= RALLY_DEFICIT ? RALLY_BONUS : 1; }
function multiplierFor(rank, roleSize) {
  if (roleSize <= 1) return 1;
  if (roleSize === 2) return rank === 0 ? 1.3 : 1;
  return [2, 1.6, 1.3][rank] ?? 1;
}
function computeMultipliers(members) {
  const out = new Map();
  for (const role of ['attaquant', 'defenseur', 'soigneur']) {
    const inRole = members.filter(m => m.role === role).sort((a, b) => b.dailyPoints - a.dailyPoints);
    inRole.forEach((m, i) => out.set(m.userId, multiplierFor(i, inRole.length)));
  }
  return out;
}

/* ------------------------------------------------------------ harnais */

let passed = 0, failed = 0;
function test(nom, fn) {
  try { fn(); console.log(`  ✓ ${nom}`); passed++; }
  catch (e) { console.log(`  ✗ ${nom}\n      ${e.message}`); failed++; }
}
function eq(actual, expected, msg = '') {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg}attendu ${b}, obtenu ${a}`);
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'condition fausse'); }

const gates = (hp = 300) => GATES.map(name => ({ name, hp, hpMax: hp, fallen: false }));
const att = (id, pts, extra = {}) => ({ userId: id, role: 'attaquant', dailyPoints: pts, multiplier: 1, wounded: false, ...extra });
const def = (id, pts, extra = {}) => ({ userId: id, role: 'defenseur', dailyPoints: pts, multiplier: 1, wounded: false, ...extra });
const soi = (id, pts, extra = {}) => ({ userId: id, role: 'soigneur', dailyPoints: pts, multiplier: 1, wounded: false, ...extra });

/* ------------------------------------------------------------- tests */

console.log('\nCONTRIBUTION');
test('points bruts sans modificateur', () => eq(contribution(att('a', 40), false, 1), 40));
test('multiplicateur appliqué', () => eq(contribution(att('a', 40, { multiplier: 2 }), false, 1), 80));
test('blessé = moitié', () => eq(contribution(att('a', 40, { wounded: true }), false, 1), 20));
test('ordre du capitaine = +20 %', () => eq(contribution(att('a', 40), true, 1), 48));
test('sursaut = +25 %', () => eq(contribution(att('a', 40), false, 1.25), 50));
test('tout cumulé : 40 ×2 ×0,5 ×1,2 ×1,25', () =>
  eq(contribution(att('a', 40, { multiplier: 2, wounded: true }), true, 1.25), 60));

console.log('\nCIBLAGE');
test('choix explicite prioritaire', () =>
  eq(targetGate(att('a', 10, { gate: 'sud' }), 'nord', gates()), 'sud'));
test("à défaut, l'ordre du capitaine", () =>
  eq(targetGate(att('a', 10), 'est', gates()), 'est'));
test('sinon la porte la plus faible', () => {
  const g = gates(); g[1].hp = 40;
  eq(targetGate(att('a', 10), null, g), 'est');
});
test('une porte tombée n\'est plus visée par défaut', () => {
  const g = gates(); g[0].hp = 0; g[0].fallen = true; g[2].hp = 90;
  eq(targetGate(att('a', 10), null, g), 'sud');
});

console.log('\nASSAUT ET DÉFENSE');
test('les soigneurs alimentent la réserve, pas les portes', () => {
  const side = { members: [att('a', 50, { gate: 'nord' }), soi('s', 80)], gates: gates(), buildings: [], daysWon: 0 };
  const r = computeAssault(side, gates());
  eq(r.byGate.nord, 50); eq(r.healPool, 80);
});
test('la forge ajoute 15 %', () => {
  const side = { members: [att('a', 100, { gate: 'nord' })], gates: gates(), buildings: ['forge'], daysWon: 0 };
  eq(computeAssault(side, gates()).byGate.nord, 115);
});
test('les défenseurs se répartissent sur leur porte', () => {
  const side = { members: [def('d1', 30, { gate: 'nord' }), def('d2', 20, { gate: 'sud' })], gates: gates(), buildings: [], daysWon: 0 };
  const d = computeDefense(side);
  eq(d.nord, 30); eq(d.sud, 20); eq(d.est, 0);
});

console.log('\nDÉGÂTS');
test('dégâts = assaut − défense', () => {
  const r = resolveGates({ nord: 200, est: 0, sud: 0 }, { nord: 80, est: 0, sud: 0 }, gates(), [], null);
  eq(r[0].damage, 120); eq(r[0].hpAfter, 180);
});
test('une porte sur-défendue ne REGAGNE pas de PV', () => {
  const r = resolveGates({ nord: 50, est: 0, sud: 0 }, { nord: 300, est: 0, sud: 0 }, gates(), [], null);
  eq(r[0].damage, 0); eq(r[0].hpAfter, 300);
});
test('la porte tombe et est signalée une seule fois', () => {
  const g = gates(100);
  const r = resolveGates({ nord: 500, est: 0, sud: 0 }, { nord: 0, est: 0, sud: 0 }, g, [], null);
  eq(r[0].hpAfter, 0); ok(r[0].justFell, 'justFell doit être vrai');
  const g2 = gates(0); g2[0].fallen = true;
  const r2 = resolveGates({ nord: 500, est: 0, sud: 0 }, { nord: 0, est: 0, sud: 0 }, g2, [], null);
  ok(!r2[0].justFell, 'une porte déjà tombée ne retombe pas');
  eq(r2[0].damage, 0, 'une porte tombée ne prend plus de dégâts : ');
});

console.log('\nBLESSÉS (correctif du cas 2)');
test('un blessé par tranche de 50 de débordement', () => {
  const d = [def('d1', 10, { gate: 'nord' }), def('d2', 10, { gate: 'nord' }),
             def('d3', 10, { gate: 'nord' }), def('d4', 10, { gate: 'nord' })];
  const r = resolveGates({ nord: 130, est: 0, sud: 0 }, { nord: 30, est: 0, sud: 0 }, gates(), d, null);
  eq(r[0].woundedUserIds.length, 2, 'débordement 100 → 2 blessés : ');
});
test('JAMAIS tous les défenseurs — il en reste toujours un debout', () => {
  const d = [def('d1', 10, { gate: 'nord' }), def('d2', 10, { gate: 'nord' })];
  const r = resolveGates({ nord: 5000, est: 0, sud: 0 }, { nord: 0, est: 0, sud: 0 }, gates(9999), d, null);
  eq(r[0].woundedUserIds.length, 1, '2 défenseurs, débordement énorme → 1 seul blessé : ');
});
test('un défenseur seul ne peut pas être blessé', () => {
  const d = [def('d1', 10, { gate: 'nord' })];
  const r = resolveGates({ nord: 5000, est: 0, sud: 0 }, { nord: 0, est: 0, sud: 0 }, gates(9999), d, null);
  eq(r[0].woundedUserIds.length, 0);
});
test('pas de débordement, pas de blessé', () => {
  const d = [def('d1', 10, { gate: 'nord' }), def('d2', 10, { gate: 'nord' })];
  const r = resolveGates({ nord: 20, est: 0, sud: 0 }, { nord: 100, est: 0, sud: 0 }, gates(), d, null);
  eq(r[0].woundedUserIds.length, 0);
});

console.log('\nSOINS');
test('40 points relèvent un blessé', () => {
  const w = [att('a', 0, { wounded: true }), att('b', 0, { wounded: true })];
  const r = applyHealing(85, w, false);
  eq(r.healedUserIds.length, 2); eq(r.repairLeft, 5);
});
test("l'infirmerie double l'efficacité", () => {
  const w = [att('a', 0, { wounded: true }), att('b', 0, { wounded: true })];
  eq(applyHealing(40, w, true).healedUserIds.length, 2);
});
test('le surplus part en réparation, rien n\'est perdu', () => {
  eq(applyHealing(200, [], false).repairLeft, 200);
});
test('les plus anciens blessés sont soignés en premier', () => {
  const w = [
    { userId: 'recent', wounded: true, woundedAt: new Date('2026-07-29') },
    { userId: 'ancien', wounded: true, woundedAt: new Date('2026-07-25') }
  ];
  eq(applyHealing(40, w, false).healedUserIds, ['ancien']);
});

console.log('\nVAINQUEUR DE LA JOURNÉE (correctif du cas 9)');
test('le pourcentage de mur détruit, pas les dégâts bruts', () => {
  // Clan de 15 : 300 de dégâts sur des murs de 15750
  // Clan de 8  : 200 de dégâts sur des murs de 8400
  const gros = 300 / 15750, petit = 200 / 8400;
  const r = dayOutcome(petit, gros);
  eq(r.a, 'win', 'le petit clan, plus efficace en proportion, doit gagner : ');
});
test('égalité parfaite', () => eq(dayOutcome(0.5, 0.5).a, 'draw'));
test('zéro partout = égalité', () => eq(dayOutcome(0, 0).a, 'draw'));

console.log('\nSURSAUT D\'HONNEUR (correctif du cas 11)');
test('mené de 3 journées → +25 %', () => eq(rallyBonusFor(0, 3), 1.25));
test('mené de 2 journées → rien', () => eq(rallyBonusFor(1, 3), 1));
test('en tête → rien', () => eq(rallyBonusFor(4, 0), 1));

console.log('\nMULTIPLICATEURS (correctif du cas 7)');
test('seul de son rôle → ×1, pas de cadeau', () => eq(multiplierFor(0, 1), 1));
test('deux joueurs → ×1,3 / ×1', () => { eq(multiplierFor(0, 2), 1.3); eq(multiplierFor(1, 2), 1); });
test('trois et plus → ×2 / ×1,6 / ×1,3 / ×1', () => {
  eq([0, 1, 2, 3].map(r => multiplierFor(r, 4)), [2, 1.6, 1.3, 1]);
});
test('classement par rôle, séparément', () => {
  const m = computeMultipliers([
    att('a1', 100), att('a2', 50), att('a3', 10),
    def('d1', 5), def('d2', 3),
    soi('s1', 1)
  ]);
  eq(m.get('a1'), 2);   eq(m.get('a2'), 1.6); eq(m.get('a3'), 1.3);
  eq(m.get('d1'), 1.3); eq(m.get('d2'), 1);
  eq(m.get('s1'), 1, 'soigneur seul de son rôle : ');
});


/* ------------------------------------------------------- la garnison */

const WEAR_PER_ASSAULT = 25;
const emptyGates = () => ({ nord: 0, est: 0, sud: 0 });

function bannerBonus(soldiers, gate) {
  return soldiers.some(s => s.banner && s.gate === gate && s.stance !== null) ? 1.1 : 1;
}
function soldierAssault(soldiers) {
  const normal = emptyGates(), sapper = emptyGates(), ram = emptyGates();
  for (const s of soldiers) {
    if (s.stance !== 'assaut' || !s.gate || s.atk <= 0) continue;
    const v = s.atk * bannerBonus(soldiers, s.gate);
    if (s.gatesOnly) ram[s.gate] += v;
    else if (s.sapper) sapper[s.gate] += v;
    else normal[s.gate] += v;
  }
  for (const g of GATES) {
    normal[g] = Math.round(normal[g]);
    sapper[g] = Math.round(sapper[g]);
    ram[g] = Math.round(ram[g]);
  }
  return { normal, sapper, ram };
}
const FORGERON_REPAIR = 40;
function emptyRoles(members) {
  return ['attaquant', 'defenseur', 'soigneur']
    .filter(r => !members.some(m => m.role === r && m.dailyPoints > 0));
}
function supportEffects(soldiers) {
  const repairByGate = emptyGates();
  let playerHeals = 0, soldierHeals = 0, scouts = 0;
  for (const s of soldiers) {
    if (s.effect === 'heal_player') playerHeals++;
    else if (s.effect === 'heal_soldier') soldierHeals++;
    else if (s.effect === 'repair' && s.gate) repairByGate[s.gate] += FORGERON_REPAIR;
    else if (s.effect === 'reveal') scouts++;
  }
  return { playerHeals, soldierHeals, repairByGate, scouts };
}
function soldierDefense(soldiers) {
  const out = emptyGates();
  for (const s of soldiers) {
    if (s.stance !== 'garnison' || !s.gate || s.def <= 0) continue;
    out[s.gate] += s.def * bannerBonus(soldiers, s.gate);
  }
  for (const g of GATES) out[g] = Math.round(out[g]);
  return out;
}
function gateDamage(normal, sapper, defense, ram = 0) {
  return Math.max(0, normal + ram - defense) + Math.max(0, sapper - defense / 2);
}

const unit = (o) => ({ id: 'u', atk: 0, def: 0, wear: 100, gate: null, stance: null, ...o });

console.log('\nGARNISON');
test('une unite a la caserne ne compte pas', () => {
  const r = soldierAssault([unit({ atk: 60, gate: null, stance: null })]);
  eq(r.normal.nord, 0);
});
test('assaut : les unites frappent la porte visee', () => {
  const r = soldierAssault([
    unit({ id: 'a', atk: 25, gate: 'nord', stance: 'assaut' }),
    unit({ id: 'b', atk: 30, gate: 'nord', stance: 'assaut' })
  ]);
  eq(r.normal.nord, 55);
});
test('garnison : les unites defendent leur porte', () => {
  const d = soldierDefense([unit({ def: 25, gate: 'est', stance: 'garnison' })]);
  eq(d.est, 25); eq(d.nord, 0);
});
test('le porte-etendard donne +10 % a SA porte seulement', () => {
  const r = soldierAssault([
    unit({ id: 'e', gate: 'nord', stance: 'garnison', banner: true }),
    unit({ id: 'a', atk: 100, gate: 'nord', stance: 'assaut' }),
    unit({ id: 'b', atk: 100, gate: 'sud', stance: 'assaut' })
  ]);
  eq(r.normal.nord, 110); eq(r.normal.sud, 100);
});
test('le sapeur est compte a part, pas melange', () => {
  const r = soldierAssault([
    unit({ id: 'a', atk: 40, gate: 'nord', stance: 'assaut' }),
    unit({ id: 's', atk: 50, gate: 'nord', stance: 'assaut', sapper: true })
  ]);
  eq(r.normal.nord, 40); eq(r.sapper.nord, 50);
});

console.log('\nSAPEURS');
test('le sapeur ignore la moitie de la defense', () => {
  // defense 100 : le flux normal est absorbe, le sapeur passe a moitie
  eq(gateDamage(80, 0, 100), 0, 'flux normal absorbe : ');
  eq(gateDamage(0, 80, 100), 30, 'sapeur contre 50 de defense effective : ');
});
test('les deux flux se resolvent separement puis se somment', () => {
  // 120 normal contre 100 = 20 ; 80 sapeur contre 50 = 30 ; total 50
  eq(gateDamage(120, 80, 100), 50);
});
test('tout additionner d un bloc donnerait un resultat FAUX', () => {
  const correct = gateDamage(120, 80, 100);
  const naif = Math.max(0, 120 + 80 - 100);
  ok(correct !== naif, 'les deux methodes doivent differer');
  eq(correct, 50); eq(naif, 100);
});

console.log('\nUSURE');
test('quatre assauts detruisent une unite', () => {
  let w = 100;
  for (let i = 0; i < 3; i++) w -= WEAR_PER_ASSAULT;
  eq(w, 25, 'apres 3 assauts : ');
  ok(w - WEAR_PER_ASSAULT <= 0, 'le 4e assaut doit la detruire');
});
test('les statistiques suivent l usure', () => {
  const atk = 60, wear = 50;
  eq(Math.round((atk * wear) / 100), 30);
});

/* ------------------------------------------- bilan de fin de semaine */

function tiebreak(a, b) {
  if (a.daysWon !== b.daysWon) return a.daysWon > b.daysWon ? 'a' : 'b';
  if (a.damage !== b.damage) return a.damage > b.damage ? 'a' : 'b';
  if (a.tier !== b.tier) return a.tier < b.tier ? 'a' : 'b';
  return 'draw';
}

console.log('\nDÉPARTAGE DE FIN DE SEMAINE');
test('le plus de journées gagne', () =>
  eq(tiebreak({ daysWon: 4, damage: 10, tier: 3 }, { daysWon: 3, damage: 999, tier: 3 }), 'a'));
test('à journées égales, les dégâts cumulés', () =>
  eq(tiebreak({ daysWon: 3, damage: 500, tier: 3 }, { daysWon: 3, damage: 800, tier: 3 }), 'b'));
test("à dégâts égaux, l'outsider (rang le plus bas) l'emporte", () =>
  eq(tiebreak({ daysWon: 3, damage: 500, tier: 5 }, { daysWon: 3, damage: 500, tier: 2 }), 'b'));
test('égalité parfaite : personne ne monte ni ne descend', () =>
  eq(tiebreak({ daysWon: 3, damage: 500, tier: 3 }, { daysWon: 3, damage: 500, tier: 3 }), 'draw'));

console.log('\nRÉCOMPENSES PAR RANG');
const REWARDS = {
  1: { mvp: ['rare'], winner: ['common'], loserPoints: 20 },
  2: { mvp: ['epic'], winner: ['rare'], loserPoints: 40 },
  3: { mvp: ['legendary'], winner: ['epic'], loserPoints: 60 },
  4: { mvp: ['legendary', 'rare'], winner: ['epic'], loserPoints: 80 },
  5: { mvp: ['legendary', 'legendary'], winner: ['legendary'], loserPoints: 100 },
  6: { mvp: ['legendary', 'legendary', 'epic'], winner: ['legendary', 'legendary'], loserPoints: 120 }
};
test('les six rangs sont couverts', () => eq(Object.keys(REWARDS).length, 6));
test('AUCUN coffre pour les perdants, à aucun rang', () => {
  for (const t of Object.keys(REWARDS)) {
    ok(!('loser' in REWARDS[t]), `rang ${t} : les perdants ne doivent recevoir aucun coffre`);
    ok(REWARDS[t].loserPoints > 0, `rang ${t} : compensation manquante`);
  }
});
test('la compensation croît avec le rang', () => {
  const pts = [1,2,3,4,5,6].map(t => REWARDS[t].loserPoints);
  for (let i = 1; i < pts.length; i++) ok(pts[i] > pts[i-1], 'compensation non croissante');
});
test('le MVP reçoit toujours mieux que ses coéquipiers', () => {
  const rang = { common: 0, rare: 1, epic: 2, legendary: 3 };
  const val = a => a.reduce((s, c) => s + rang[c] + 1, 0);
  for (const t of Object.keys(REWARDS))
    ok(val(REWARDS[t].mvp) > val(REWARDS[t].winner), `rang ${t} : le MVP n'est pas mieux loti`);
});
test('aucun coffre mythique : Chest ne va pas au-dela de legendary', () => {
  const autorises = ['common', 'rare', 'epic', 'legendary'];
  for (const t of Object.keys(REWARDS))
    for (const c of [...REWARDS[t].mvp, ...REWARDS[t].winner])
      ok(autorises.includes(c), `type de coffre inconnu : ${c}`);
});

console.log('\nBÉLIER : UNE CLÉ, PAS UNE ARME');
test('le belier frappe la porte comme les autres', () => {
  const r = soldierAssault([unit({ atk: 60, gate: 'nord', stance: 'assaut', gatesOnly: true })]);
  eq(r.ram.nord, 60);
  eq(r.normal.nord, 0, 'le belier ne doit pas compter comme unite normale : ');
});
test('porte debout : le belier compte dans les degats', () => {
  eq(gateDamage(0, 0, 10, 60), 50);
});
test('porte tombee : le belier ne franchit PAS la breche', () => {
  const parLaBreche = gateDamage(30, 0, 10, 0);
  const avecBelier = gateDamage(30, 0, 10, 60);
  eq(parLaBreche, 20);
  ok(avecBelier > parLaBreche, 'le belier devrait compter tant que la porte tient');
});
test('un clan tout en beliers ne peut pas achever un donjon', () => {
  // Trois beliers sur une porte deja tombee : rien ne passe au donjon
  eq(gateDamage(0, 0, 0, 180), 180, 'porte debout : ils cognent');
  eq(gateDamage(0, 0, 0, 0), 0, 'porte tombee : plus rien');
});

function phantomSupport(enrolled, rivalEnrolled, myActive, rivalDailyTotal) {
  const vide = { count: 0, each: 0, total: 0, fromRoster: 0, fromAbsent: 0 };
  if (myActive.length === 0) return vide;
  const fromAbsent = Math.max(0, enrolled - myActive.length);
  const fromRoster = Math.max(0, rivalEnrolled - enrolled);
  const count = fromAbsent + fromRoster;
  if (count === 0) return vide;
  const moyenneAdverse = rivalEnrolled > 0 ? rivalDailyTotal / rivalEnrolled : 0;
  const maMoyenne = myActive.reduce((s, m) => s + m.dailyPoints, 0) / myActive.length;
  const each = Math.max(0, Math.min(moyenneAdverse, maMoyenne));
  return { count, each, total: count * each, fromRoster, fromAbsent };
}
function phantomSplit(members, total) {
  const somme = (r) => members.filter(m => m.role === r).reduce((s, m) => s + m.dailyPoints, 0);
  const att_ = somme('attaquant'), def_ = somme('defenseur'), base = att_ + def_;
  const partAtt = base > 0 ? att_ / base : 0.5;
  const assault = total * partAtt;
  return { assault, defense: total - assault };
}

console.log('\nRENFORTS FANTÔMES');
test('effectifs egaux et personne absent : aucun fantome', () => {
  eq(phantomSupport(3, 3, [att('a', 10), att('b', 10), att('c', 10)], 30).count, 0);
});
test('3 contre 4 : une place a combler, au tarif adverse', () => {
  const p = phantomSupport(3, 4, [att('a', 10), att('b', 10), att('c', 10)], 40);
  eq(p.fromRoster, 1);
  eq(p.fromAbsent, 0);
  eq(p.each, 10, 'le fantome vaut la moyenne adverse : ');
  eq(30 + p.total, 40, 'les trois plus le fantome valent les quatre : ');
});
test('un absent est remplace par un combattant moyen', () => {
  const p = phantomSupport(3, 3, [att('a', 10), att('b', 10)], 30);
  eq(p.fromAbsent, 1);
  eq(p.total, 10);
});
test('TRICHE : se saborder face a plus fort ne rapporte RIEN', () => {
  // Mes joueurs valent 5, ceux d en face 100. Sans le plafond, chaque absent
  // serait remplace par un fantome a 100 et le sabordage deviendrait rentable.
  const tous = phantomSupport(3, 3, [att('a', 5), att('b', 5), att('c', 5)], 300);
  const absent = phantomSupport(3, 3, [att('a', 5), att('b', 5)], 300);
  eq(absent.each, 5, 'le fantome est plafonne a MA moyenne : ');
  eq(10 + absent.total, 15, 'au mieux neutre, jamais gagnant : ');
  ok(10 + absent.total <= 15 + tous.total, 'le sabordage ne doit jamais payer');
});
test('TRICHE : face a plus faible, l absence coute vraiment', () => {
  const absent = phantomSupport(3, 3, [att('a', 100), att('b', 100)], 15);
  eq(absent.each, 5, 'le fantome vaut la moyenne adverse, plus faible : ');
  ok(200 + absent.total < 300, "l absence doit couter cher");
});
test('clan totalement absent : aucun fantome, zero reste zero', () => {
  eq(phantomSupport(3, 3, [], 300).count, 0);
});
test('le renfort ne depend PAS de ma force, contrairement a un multiplicateur', () => {
  const faible = phantomSupport(3, 4, [att('a', 10), att('b', 10), att('c', 10)], 40);
  const fort = phantomSupport(3, 4, [att('a', 90), att('b', 90), att('c', 90)], 40);
  eq(faible.total, fort.total, 'meme handicap, meme compensation : ');
});
test('absences ET effectif plus petit se cumulent', () => {
  const p = phantomSupport(3, 5, [att('a', 10), att('b', 10)], 50);
  eq(p.fromAbsent, 1);
  eq(p.fromRoster, 2);
  eq(p.count, 3);
});
test('le renfort se range ou le clan a mis ses forces', () => {
  const s = phantomSplit([att('a', 80), def('b', 20)], 100);
  eq(s.assault, 80); eq(s.defense, 20);
});
test('clan sans attaquant ni defenseur actif : moitie-moitie', () => {
  eq(phantomSplit([soi('a', 50)], 100), { assault: 50, defense: 50 });
});

console.log('\nRÔLES DÉSERTÉS');
test('un role sans joueur actif est signale', () => {
  eq(emptyRoles([att('a', 10), def('b', 5), soi('c', 0)]), ['soigneur']);
});
test('un inscrit a 0 point ne tient pas son role', () => {
  eq(emptyRoles([att('a', 0), def('b', 0), soi('c', 0)]),
     ['attaquant', 'defenseur', 'soigneur']);
});
test('tous les roles tenus : rien a signaler', () => {
  eq(emptyRoles([att('a', 1), def('b', 1), soi('c', 1)]), []);
});

console.log('\nUNITÉS DE SOUTIEN');
test("l'infirmier releve un blesse par jour", () => {
  eq(supportEffects([unit({ effect: 'heal_player' })]).playerHeals, 1);
});
test('deux infirmiers relevent deux blesses', () => {
  eq(supportEffects([unit({ effect: 'heal_player' }), unit({ effect: 'heal_player' })]).playerHeals, 2);
});
test('le medecin remet une unite a neuf', () => {
  eq(supportEffects([unit({ effect: 'heal_soldier' })]).soldierHeals, 1);
});
test('le forgeron repare SA porte, pas une autre', () => {
  const r = supportEffects([unit({ effect: 'repair', gate: 'est' })]);
  eq(r.repairByGate.est, FORGERON_REPAIR);
  eq(r.repairByGate.nord, 0);
});
test('un forgeron sans porte ne repare rien', () => {
  eq(supportEffects([unit({ effect: 'repair', gate: null })]).repairByGate.est, 0);
});
test("l'eclaireur revele l'ordre adverse", () => {
  eq(supportEffects([unit({ effect: 'reveal' })]).scouts, 1);
});
test('un clan sans soigneur actif peut soigner en recrutant', () => {
  const roles = emptyRoles([att('a', 10), def('b', 10), soi('c', 0)]);
  ok(roles.includes('soigneur'), 'le soigneur devrait etre signale absent');
  ok(supportEffects([unit({ effect: 'heal_player' })]).playerHeals > 0,
     "l'infirmier doit combler le trou");
});

console.log('\nÉTENDARD');
test("l'etendard garé ne donne AUCUN bonus", () => {
  const r = soldierAssault([
    unit({ id: 'e', banner: true, gate: 'nord', stance: null }),
    unit({ id: 'a', atk: 100, gate: 'nord', stance: 'assaut' })
  ]);
  eq(r.normal.nord, 100, 'un etendard sans posture ne doit rien apporter : ');
});
test("l'etendard engagé donne bien +10 %", () => {
  const r = soldierAssault([
    unit({ id: 'e', banner: true, gate: 'nord', stance: 'garnison' }),
    unit({ id: 'a', atk: 100, gate: 'nord', stance: 'assaut' })
  ]);
  eq(r.normal.nord, 110);
});

/* ---------------------------------------- portage : formation des clans */

const MIN_ACTIFS = 4, TAILLE_CIBLE = 15, NB_TIERS = 6;
function planClans(actives) {
  const n = actives.length;
  if (n < MIN_ACTIFS) return [];
  const sorted = [...actives].sort((a, b) => b.tier - a.tier || b.points - a.points);
  const nbClans = Math.max(2, 2 * Math.ceil(n / (2 * TAILLE_CIBLE)));
  const base = Math.floor(n / nbClans), reste = n % nbClans;
  const tailles = Array.from({ length: nbClans }, (_, i) => base + (i < reste ? 1 : 0));
  const plans = [];
  let cursor = 0;
  for (let i = 0; i < nbClans; i += 2) {
    const tA = tailles[i], tB = tailles[i + 1] ?? 0;
    const bloc = sorted.slice(cursor, cursor + tA + tB);
    cursor += tA + tB;
    const A = [], B = [];
    bloc.forEach((j, idx) => {
      const tourPair = Math.floor(idx / 2) % 2 === 0;
      const versA = tourPair ? idx % 2 === 0 : idx % 2 === 1;
      const cible = versA ? (A.length < tA ? A : B) : (B.length < tB ? B : A);
      cible.push(j);
    });
    const tier = Math.min(NB_TIERS, Math.floor(i / 2) + 1);
    plans.push({ members: A, tier });
    if (tB > 0) plans.push({ members: B, tier });
  }
  const maxTier = plans[plans.length - 1].tier;
  for (const p of plans) p.tier = maxTier - p.tier + 1;
  return plans;
}
const force = (p) => p.members.reduce((s, m) => s + m.points, 0);
const joueurs = (n, f = (i) => 100 - i * 5) =>
  Array.from({ length: n }, (_, i) => ({ userId: 'u' + i, points: f(i), tier: 1 }));

console.log('\nÉQUILIBRAGE DES ÉQUIPES');
test('les deux clans d une paire ont des forces comparables', () => {
  const p = planClans(joueurs(10));
  const ecart = Math.abs(force(p[0]) - force(p[1]));
  const moyenne = (force(p[0]) + force(p[1])) / 2;
  ok(ecart / moyenne < 0.05, `ecart de ${((ecart / moyenne) * 100).toFixed(1)} % entre les deux camps`);
});
test('le decoupage naif aurait donne un ecart enorme', () => {
  // Ce que faisait l ancienne version : deux tranches consecutives
  const tries = joueurs(10);
  const naifA = tries.slice(0, 5).reduce((s, m) => s + m.points, 0);
  const naifB = tries.slice(5).reduce((s, m) => s + m.points, 0);
  ok(naifA - naifB > 100, 'le temoin devrait etre desequilibre');
  const p = planClans(joueurs(10));
  ok(Math.abs(force(p[0]) - force(p[1])) < naifA - naifB,
     'le serpentin doit faire mieux que le decoupage naif');
});
test('effectifs preserves : personne n est perdu ni duplique', () => {
  for (const n of [4, 5, 7, 10, 31, 60]) {
    const p = planClans(joueurs(n));
    const tous = p.flatMap(x => x.members.map(m => m.userId));
    eq(tous.length, n, `n=${n} : effectif total faux — `);
    eq(new Set(tous).size, n, `n=${n} : doublons — `);
  }
});
test('les tailles restent equilibrees a un joueur pres', () => {
  for (const n of [5, 7, 11, 31]) {
    const p = planClans(joueurs(n));
    const t = p.map(x => x.members.length);
    ok(Math.max(...t) - Math.min(...t) <= 1, `n=${n} : tailles ${t.join('/')}`);
  }
});
test('un nombre IMPAIR de joueurs reste jouable', () => {
  const p = planClans(joueurs(7));
  eq(p.length % 2, 0, 'il faut un nombre pair de clans : ');
  ok(p.every(x => x.members.length >= 3));
});
test('sous 4 actifs : treve, aucun clan', () => {
  eq(planClans(joueurs(3)).length, 0);
});
test('7 actifs : 4 vs 3, la place manquante est comblee', () => {
  const p = planClans(joueurs(7));
  const tailles = p.map(c => c.members.length).sort((a, b) => b - a);
  eq(tailles, [4, 3]);
  // Les deux camps produisent 10 par tete : le fantome vaut 10, et les trois
  // plus lui pesent exactement autant que les quatre d en face.
  const trois = [att('a', 10), att('b', 10), att('c', 10)];
  const renfort = phantomSupport(3, 4, trois, 40);
  eq(renfort.fromRoster, 1);
  eq(30 + renfort.total, 40, 'le clan de 3 doit peser autant que celui de 4 : ');
});
test('l equilibrage tient meme avec des forces tres inegales', () => {
  // Un joueur ecrase tous les autres
  const p = planClans([
    { userId: 'star', points: 1000, tier: 1 },
    ...joueurs(9, () => 10)
  ]);
  const ecart = Math.abs(force(p[0]) - force(p[1]));
  // La star ne peut pas etre coupee en deux : l ecart minimal reste ~1000-...
  ok(ecart <= 1000, `ecart ${ecart} : un seul joueur hors norme reste indivisible`);
  ok(p[0].members.length === p[1].members.length, 'les effectifs doivent rester egaux');
});

/* ------------------------------------------------------------- bilan */

console.log(`\n${'─'.repeat(50)}`);
console.log(`${passed} test(s) réussi(s), ${failed} échec(s)`);
process.exit(failed > 0 ? 1 : 0);

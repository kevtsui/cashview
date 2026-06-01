/* Household CashView — mock data. Placeholder figures; swap freely.
   Household: KFJN (members Kevin & Flora).  */
window.HH = (function () {
  const members = [
    { id: 'k', name: 'Kevin', initials: 'K', color: '#E5634A' },
    { id: 'm', name: 'Flora', initials: 'F', color: '#3C8C7E' }
  ];

  // institutions + accounts
  const accounts = [
    { id: 'chk1', inst: 'Chase', name: 'Total Checking', mask: '4421', type: 'checking', group: 'cash',
      balance: 8420.16, available: 8120.16, owner: 'k', apy: 0.01,
      logo: 'chase' },
    { id: 'sav1', inst: 'Chase', name: 'Premier Savings', mask: '7783', type: 'savings', group: 'cash',
      balance: 24150.00, available: 24150.00, owner: 'm', apy: 1.4,
      logo: 'chase' },
    { id: 'cc1', inst: 'Chase', name: 'Sapphire Reserve', mask: '0098', type: 'credit', group: 'debt',
      balance: -3284.52, limit: 22000, owner: 'k', apr: 22.49, due: 'Jun 14', logo: 'chase' },
    { id: 'chk2', inst: 'Morgan Stanley', name: 'CashPlus Checking', mask: '1052', type: 'checking', group: 'cash',
      balance: 12300.42, available: 12300.42, owner: 'm', apy: 0.5, logo: 'ms' },
    { id: 'sav2', inst: 'Morgan Stanley', name: 'Premium Savings', mask: '6610', type: 'savings', group: 'cash',
      balance: 40000.00, available: 40000.00, owner: 'k', apy: 4.25, logo: 'ms' },
    { id: 'inv1', inst: 'Morgan Stanley', name: 'Brokerage', mask: '3390', type: 'brokerage', group: 'invest',
      balance: 186420.88, owner: 'k', dayChange: 0.83, logo: 'ms' },
    { id: 'inv2', inst: 'Morgan Stanley', name: 'Joint IRA', mask: '8841', type: 'retirement', group: 'invest',
      balance: 94210.55, owner: 'm', dayChange: 0.61, logo: 'ms' }
  ];

  const sum = (f) => accounts.filter(f).reduce((a, b) => a + b.balance, 0);
  const totals = {
    cash: sum(a => a.group === 'cash'),
    invest: sum(a => a.group === 'invest'),
    debt: Math.abs(sum(a => a.group === 'debt')),
    get netWorth() { return this.cash + this.invest - this.debt; }
  };

  // 12-month net-worth + cash trend (oldest -> newest)
  const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
  const netWorthSeries = [231, 234, 233, 239, 244, 241, 248, 252, 255, 259, 263, 267.99].map((v,i)=>({ month:months[i], value:v*1000 }));
  const cashSeries =      [71, 73, 70, 74, 78, 76, 81, 79, 80, 83, 84, 84.87].map((v,i)=>({ month:months[i], value:v*1000 }));

  // spending categories — this month
  const categories = [
    { id:'housing',  label:'Housing',        spent:3200, budget:3200, color:'#5C534D', icon:'home' },
    { id:'grocery',  label:'Groceries',      spent:842,  budget:1000, color:'#3C8C7E', icon:'shopping-cart' },
    { id:'dining',   label:'Dining out',     spent:611,  budget:500,  color:'#E5634A', icon:'utensils' },
    { id:'transport',label:'Transport',      spent:388,  budget:450,  color:'#D99A22', icon:'car' },
    { id:'kids',     label:'Kids',           spent:520,  budget:600,  color:'#8A5A7A', icon:'baby' },
    { id:'utilities',label:'Utilities',      spent:284,  budget:320,  color:'#7A716A', icon:'zap' },
    { id:'shopping', label:'Shopping',       spent:476,  budget:400,  color:'#C84F36', icon:'shopping-bag' },
    { id:'health',   label:'Health',         spent:198,  budget:300,  color:'#1F8A5B', icon:'heart-pulse' },
    { id:'fun',      label:'Entertainment',  spent:240,  budget:250,  color:'#ED7551', icon:'clapperboard' }
  ];
  const spendTotal = categories.reduce((a,c)=>a+c.spent,0);
  const budgetTotal = categories.reduce((a,c)=>a+c.budget,0);

  // monthly spend trend
  const spendTrend = [5980, 6240, 5710, 6510, 7020, 6180, 6890, 6420, 5990, 6730, 7110, spendTotal].map((v,i)=>({ month:months[i], value:v }));

  // recent transactions (newest first)
  const tx = [
    { id:1, merchant:'Whole Foods Market', cat:'grocery', amt:-142.18, acct:'chk1', who:'m', date:'May 31', logo:'WF' },
    { id:2, merchant:'Tatsu Ramen',        cat:'dining',  amt:-58.40,  acct:'cc1',  who:'k', date:'May 31', logo:'TR' },
    { id:3, merchant:'Shell',              cat:'transport',amt:-71.02, acct:'cc1',  who:'k', date:'May 30', logo:'SH' },
    { id:4, merchant:'Payroll — Acme Corp',cat:'income',  amt:6420.00, acct:'chk1', who:'k', date:'May 30', logo:'AC', income:true },
    { id:5, merchant:'Pacific Gas & Elec', cat:'utilities',amt:-186.44,acct:'chk2', who:'m', date:'May 29', logo:'PG' },
    { id:6, merchant:'Amazon',             cat:'shopping', amt:-94.27, acct:'cc1',  who:'m', date:'May 29', logo:'AZ' },
    { id:7, merchant:'Bright Horizons',    cat:'kids',     amt:-420.00,acct:'chk2', who:'m', date:'May 28', logo:'BH' },
    { id:8, merchant:'Netflix',            cat:'fun',      amt:-22.99, acct:'cc1',  who:'k', date:'May 28', logo:'NF' },
    { id:9, merchant:'Trader Joe\u2019s',  cat:'grocery',  amt:-88.63, acct:'chk1', who:'k', date:'May 27', logo:'TJ' },
    { id:10,merchant:'Equinox',            cat:'health',   amt:-198.00,acct:'cc1',  who:'k', date:'May 27', logo:'EQ' },
    { id:11,merchant:'Uber',               cat:'transport',amt:-31.50, acct:'cc1',  who:'m', date:'May 26', logo:'UB' },
    { id:12,merchant:'Blue Bottle Coffee', cat:'dining',   amt:-12.75, acct:'cc1',  who:'k', date:'May 26', logo:'BB' }
  ];

  // budgets / goals (savings goals)
  const goals = [
    { id:'emerg', label:'Emergency fund',  saved:40000, target:50000, color:'#1F8A5B', icon:'shield' },
    { id:'vac',   label:'Japan trip',      saved:6200,  target:12000, color:'#E5634A', icon:'palmtree' },
    { id:'house', label:'Home down payment',saved:118000,target:200000,color:'#3C8C7E', icon:'home' }
  ];

  // upcoming bills
  const bills = [
    { id:'b1', label:'Mortgage',        amt:3200, due:'Jun 1',  acct:'chk2', auto:true, in:1 },
    { id:'b2', label:'Sapphire Reserve',amt:3284.52, due:'Jun 14', acct:'chk1', auto:true, in:14 },
    { id:'b3', label:'PG&E electric',   amt:186.44, due:'Jun 18', acct:'chk2', auto:true, in:18 },
    { id:'b4', label:'Bright Horizons', amt:420, due:'Jun 20', acct:'chk2', auto:false, in:20 }
  ];

  const catById = Object.fromEntries(categories.map(c=>[c.id,c]));
  const acctById = Object.fromEntries(accounts.map(a=>[a.id,a]));
  const memberById = Object.fromEntries(members.map(m=>[m.id,m]));

  return { members, accounts, totals, netWorthSeries, cashSeries, categories, spendTotal,
           budgetTotal, spendTrend, tx, goals, bills, catById, acctById, memberById, months };
})();

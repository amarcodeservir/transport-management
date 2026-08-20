export const formatCurrency = (v)=> new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(v);

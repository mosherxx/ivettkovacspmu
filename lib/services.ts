export const services = [
 {id:'hair',hu:'Szálas szemöldöktetoválás',en:'Hairstroke brows',price:80000,description:['Finom szálak, természetes összhatás.','Fine strokes. A naturally defined look.']},
 {id:'powder',hu:'Púderes szemöldöktetoválás',en:'Powder brows',price:80000,description:['Lágy satírozás, harmonikus forma.','Soft shading and a balanced shape.']},
 {id:'lips',hu:'Ajaktetoválás teljes satír',en:'Full lip blush',price:80000,description:['Finom szín, hangsúlyosabb ajakkontúr.','Subtle colour and a more defined lip contour.']},
 {id:'consult',hu:'Előzetes konzultáció',en:'Design consultation',price:10000,description:['Felrajzolás és személyre szabott tervezés.','Mapping and personalised design.']},
 {id:'correction',hu:'Második korrekció · 12 héten belül',en:'Second touch-up · within 12 weeks',price:25000,description:['Szükség esetén.','If needed.']},
 {id:'refresh18',hu:'Frissítés · 18 hónapon belül',en:'Refresh · within 18 months',price:55000,description:['','']},
 {id:'refresh24',hu:'Frissítés · 18–24 hónap között',en:'Refresh · 18–24 months',price:70000,description:['','']},
];
export const money=(n:number)=>new Intl.NumberFormat('hu-HU').format(n)+' Ft';

// Keep the selected document language when returning to the main website.
try {
  localStorage.setItem('ivett-language', document.documentElement.lang);
} catch {
  // Documents and their language links also work with browser storage disabled.
}

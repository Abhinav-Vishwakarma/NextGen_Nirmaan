async function check() {
  const r = await fetch('http://localhost:6333/collections/regulatory_library');
  console.log(await r.text())
}
check();

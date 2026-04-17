async function drop() {
  const res = await fetch('http://localhost:6333/collections/regulatory_library', {
    method: 'DELETE'
  });
  console.log(await res.text())
}
drop();

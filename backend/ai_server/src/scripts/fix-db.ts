async function fix() {
  await fetch('http://localhost:6333/collections/regulatory_library', { method: 'DELETE' });
  const res = await fetch('http://localhost:6333/collections/regulatory_library', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vectors: { size: 3072, distance: 'Cosine' } })
  });
  console.log("Recreated DB:", await res.text());
}
fix();

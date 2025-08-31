// Teste simples para ver se conseguimos mais detalhes
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjFiNzZmNTMwNzRhM2JhYmQwNGYwZCIsInVzZXJuYW1lIjoiZGVuZXJhbHZlcyIsInByb3ZpZGVyIjoibG9jYWwiLCJlbWFpbCI6ImRlbmVyYWx2ZXNAa2FmZmNvLmNvbS5iciIsImlhdCI6MTc1NjY3NzYxNCwiZXhwIjoxNzU2Njc4NTE0fQ.BaKKV-fSnVYyJUwp8tYqxsAuse75kb9irbkLrSIrPsU';

console.log('🔍 Testando API admin diretamente...\n');

fetch('http://localhost:3080/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.log('Error:', error.message);
});

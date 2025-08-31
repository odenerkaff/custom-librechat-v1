// Simples teste para verificar usuários na API
fetch('/api/admin/users')
  .then(response => response.json())
  .then(users => console.log('USUÁRIOS:', users))
  .catch(error => console.error('ERRO:', error));

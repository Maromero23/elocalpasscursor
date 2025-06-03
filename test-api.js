console.log('Testing API directly...')
fetch('http://localhost:3000/api/admin/distributors', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(res => {
  console.log('Status:', res.status)
  return res.text()
})
.then(text => {
  console.log('Response:', text)
})
.catch(err => {
  console.error('Error:', err)
})

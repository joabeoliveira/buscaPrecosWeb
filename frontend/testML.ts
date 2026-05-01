import axios from 'axios';

async function testML() {
  try {
    const res = await axios.get('https://api.mercadolibre.com/sites/MLB/search', {
      params: { q: 'Mouse optico com fio', limit: 15, condition: 'new' }
    });
    console.log('Success! Results count:', res.data.results.length);
    if (res.data.results.length > 0) {
       console.log('Sample item:', res.data.results[0].title, res.data.results[0].price);
    }
  } catch (err: any) {
    console.error('Failed:', err.response?.data || err.message);
  }
}

testML();

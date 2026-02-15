
import axios from 'axios';

const API_URL = 'http://localhost:4000';
const EMAIL = 'test.tenant.1771174017403@example.com';
const PASSWORD = 'password123';

async function testPagination() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.access_token;
        console.log('   Logged in successfully.');

        console.log('\n2. Testing Legacy findAll (No Params)...');
        const legacyRes = await axios.get(`${API_URL}/vehicles`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (Array.isArray(legacyRes.data)) {
            console.log(`   SUCCESS: Returned array of ${legacyRes.data.length} items (legacy format).`);
        } else {
            console.error('   FAILURE: Did not return array.', legacyRes.data);
        }

        console.log('\n3. Testing Paginated findAll (page=1, limit=5)...');
        const paginatedRes = await axios.get(`${API_URL}/vehicles?page=1&limit=5`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (paginatedRes.data.data && paginatedRes.data.meta) {
            console.log(`   SUCCESS: Returned object with data (${paginatedRes.data.data.length} items) and meta.`);
            console.log('   Meta:', paginatedRes.data.meta);
        } else {
            console.error('   FAILURE: Did not return { data, meta } structure.', paginatedRes.data);
        }

    } catch (error) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testPagination();

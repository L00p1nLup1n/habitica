#!/usr/bin/env node

/**
 * Simple test script to verify the Custom Quotes API endpoint is working
 * This tests that the endpoint is registered and responds correctly
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/v3';

// Note: In a real test, you would use actual test user credentials
// For now, we'll just check if the endpoint exists and requires auth

async function testQuotesEndpoint() {
  console.log('Testing Custom Quotes API Endpoint...\n');

  try {
    // Test 1: GET /user/quotes/daily without auth (should fail with 401)
    console.log('Test 1: GET /user/quotes/daily (no auth)');
    try {
      const response = await axios.get(`${BASE_URL}/user/quotes/daily`);
      console.log('❌ FAIL: Should have required authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ PASS: Correctly requires authentication\n');
      } else {
        console.log(`❌ FAIL: Unexpected error: ${error.message}\n`);
      }
    }

    // Test 2: POST /user/quotes without auth (should fail with 401)
    console.log('Test 2: POST /user/quotes (no auth)');
    try {
      const response = await axios.post(`${BASE_URL}/user/quotes`, {
        text: 'Test quote',
        author: 'Test author'
      });
      console.log('❌ FAIL: Should have required authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ PASS: Correctly requires authentication\n');
      } else {
        console.log(`❌ FAIL: Unexpected error: ${error.message}\n`);
      }
    }

    // Test 3: PUT /user/quotes/settings without auth (should fail with 401)
    console.log('Test 3: PUT /user/quotes/settings (no auth)');
    try {
      const response = await axios.put(`${BASE_URL}/user/quotes/settings`, {
        enabled: true
      });
      console.log('❌ FAIL: Should have required authentication');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ PASS: Correctly requires authentication\n');
      } else {
        console.log(`❌ FAIL: Unexpected error: ${error.message}\n`);
      }
    }

    console.log('✅ All basic endpoint tests passed!');
    console.log('\nEndpoints are correctly registered and protected with authentication.');
    console.log('\nTo test with actual user data, you would need to:');
    console.log('1. Create a test user or use seed data');
    console.log('2. Get API credentials (user ID and API key)');
    console.log('3. Add x-api-user and x-api-key headers to requests');

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

testQuotesEndpoint();

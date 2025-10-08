const { contentCache } = require('../dist/services/contentCache');

async function testCachePerformance() {
  console.log('🧪 [Cache Test] Starting cache performance test...\n');

  // Test 1: Basic cache operations
  console.log('=== Test 1: Basic Cache Operations ===');
  const testKey = 'test_content_123';
  const testValue = {
    title: 'Test Article',
    content: 'This is a test article content...',
    personalityMatch: 85
  };

  console.time('Cache Set');
  contentCache.set(testKey, testValue, 5 * 60 * 1000); // 5 minutes TTL
  console.timeEnd('Cache Set');

  console.time('Cache Get');
  const retrieved = contentCache.get(testKey);
  console.timeEnd('Cache Get');

  console.log('Cache hit success:', retrieved !== undefined);
  console.log('Retrieved value matches:', JSON.stringify(retrieved) === JSON.stringify(testValue));

  // Test 2: Cache miss performance
  console.log('\n=== Test 2: Cache Miss Performance ===');
  console.time('Cache Miss');
  const nonExistent = contentCache.get('non_existent_key_123');
  console.timeEnd('Cache Miss');
  console.log('Cache miss handled correctly:', nonExistent === undefined);

  // Test 3: Multiple cache operations
  console.log('\n=== Test 3: Bulk Operations ===');
  console.time('Bulk Cache Set (100 items)');
  for (let i = 0; i < 100; i++) {
    contentCache.set(`bulk_test_${i}`, {
      id: i,
      content: `Content ${i}`,
      timestamp: new Date()
    });
  }
  console.timeEnd('Bulk Cache Set (100 items)');

  console.time('Bulk Cache Get (100 items)');
  let hitCount = 0;
  for (let i = 0; i < 100; i++) {
    const result = contentCache.get(`bulk_test_${i}`);
    if (result !== undefined) hitCount++;
  }
  console.timeEnd('Bulk Cache Get (100 items)');
  console.log(`Bulk cache hits: ${hitCount}/100`);

  // Test 4: Cache statistics
  console.log('\n=== Test 4: Cache Statistics ===');
  const stats = contentCache.getStats();
  console.log('Cache statistics:');
  console.log(JSON.stringify(stats, null, 2));

  // Test 5: Profile caching
  console.log('\n=== Test 5: User Profile Caching ===');
  const testProfile = {
    readingLevel: 'intermediate',
    topCategories: [
      { category: 'technology', score: 0.8 },
      { category: 'science', score: 0.6 }
    ],
    contentStyle: 'practical'
  };

  console.time('Profile Cache Set');
  contentCache.set('user_profile_test', testProfile, 15 * 60 * 1000);
  console.timeEnd('Profile Cache Set');

  console.time('Profile Cache Get');
  const cachedProfile = contentCache.get('user_profile_test');
  console.timeEnd('Profile Cache Get');

  console.log('Profile cache success:', cachedProfile !== undefined);
  console.log('Profile reading level:', cachedProfile?.readingLevel);

  // Test 6: Cache key generation performance
  console.log('\n=== Test 6: Key Generation Performance ===');
  const complexObject = {
    userProfile: testProfile,
    topics: ['AI', 'Machine Learning', 'Data Science'],
    category: 'technology',
    contentStyle: 'practical',
    timestamp: new Date().toISOString()
  };

  console.time('Key Generation (100 times)');
  for (let i = 0; i < 100; i++) {
    const key = contentCache.createKey ? contentCache.createKey(complexObject, 'perf_test') : `fallback_${i}`;
  }
  console.timeEnd('Key Generation (100 times)');

  console.log('\n✅ [Cache Test] Performance test completed successfully!');
  console.log('\n📊 Final Cache Stats:');
  console.log(JSON.stringify(contentCache.getStats(), null, 2));
}

// Run the test
testCachePerformance().catch(console.error);
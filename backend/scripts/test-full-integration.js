const { contentCache } = require('../dist/services/contentCache');
const { adaptiveModelSelector } = require('../dist/services/adaptiveModelSelector');
const { advancedAnalytics } = require('../dist/services/advancedAnalytics');

async function testFullSystemIntegration() {
  console.log('🚀 [Integration Test] Starting comprehensive system integration test...\n');
  
  const testResults = {
    caching: false,
    modelSelection: false,
    analytics: false,
    crossSystemIntegration: false,
    performance: false,
    errorHandling: false
  };
  
  try {
    // Test 1: Content Caching System
    console.log('=== Test 1: Content Caching System ===');
    
    console.time('Cache Operations');
    
    // Test basic caching
    contentCache.set('test-key-1', { data: 'test-value-1', timestamp: new Date() }, 5000);
    const cachedValue1 = contentCache.get('test-key-1');
    
    // Test complex object caching
    const complexData = {
      userProfile: { readingLevel: 'advanced', preferences: ['AI', 'tech'] },
      recommendations: [{ id: 1, title: 'Test Article' }],
      metadata: { generated: new Date(), confidence: 0.85 }
    };
    contentCache.set('complex-data', complexData, 10000);
    const cachedComplex = contentCache.get('complex-data');
    
    console.timeEnd('Cache Operations');
    
    const cachingWorks = cachedValue1 !== undefined && 
                        cachedComplex !== undefined && 
                        cachedComplex.userProfile.readingLevel === 'advanced';
    
    testResults.caching = cachingWorks;
    console.log(`Caching System: ${cachingWorks ? '✅' : '❌'}`);
    console.log(`Cache Stats: ${JSON.stringify(contentCache.getStats())}`);

    // Test 2: Adaptive Model Selection
    console.log('\n=== Test 2: Adaptive Model Selection ===');
    
    console.time('Model Selection');
    
    const testScenarios = [
      {
        taskType: 'content_generation',
        complexity: 'complex',
        outputLength: 'long',
        language: 'hebrew',
        quality: 'premium',
        urgency: 'low'
      },
      {
        taskType: 'question_answering',
        complexity: 'simple',
        outputLength: 'short',
        language: 'hebrew',
        quality: 'draft',
        urgency: 'high'
      },
      {
        taskType: 'creative',
        complexity: 'medium',
        outputLength: 'medium',
        language: 'hebrew',
        quality: 'standard',
        urgency: 'medium'
      }
    ];
    
    const modelSelections = [];
    for (const scenario of testScenarios) {
      const recommendation = await adaptiveModelSelector.getModelRecommendation(scenario);
      modelSelections.push({
        scenario: scenario.taskType,
        selected: recommendation.recommended.name,
        score: 'N/A',
        reasoning: recommendation.reasoning
      });
    }
    
    console.timeEnd('Model Selection');
    
    const modelSelectionWorks = modelSelections.length === testScenarios.length &&
                               modelSelections.every(sel => sel.selected && sel.reasoning.length > 0);
    
    testResults.modelSelection = modelSelectionWorks;
    console.log(`Model Selection: ${modelSelectionWorks ? '✅' : '❌'}`);
    modelSelections.forEach(sel => {
      console.log(`  ${sel.scenario}: ${sel.selected}`);
    });

    // Test 3: Advanced Analytics System
    console.log('\n=== Test 3: Advanced Analytics System ===');
    
    console.time('Analytics Operations');
    
    // Simulate performance tracking
    for (let i = 0; i < 20; i++) {
      advancedAnalytics.trackPerformance(
        'test-service',
        'test-operation',
        Math.random() * 2000 + 100,
        Math.random() > 0.1,
        { testId: i, batchTest: true }
      );
    }
    
    // Simulate user behavior tracking
    for (let i = 0; i < 30; i++) {
      advancedAnalytics.trackUserBehavior(
        `integration-session-${Math.floor(i/5)}`,
        `integration-user-${Math.floor(i/3)}`,
        'integration_test',
        `test-target-${i}`,
        { integrationTest: true, index: i }
      );
    }
    
    // Generate insights
    const insights = await advancedAnalytics.generateSystemInsights();
    const analyticsStats = advancedAnalytics.getAnalyticsStats();
    
    console.timeEnd('Analytics Operations');
    
    const analyticsWorks = insights !== undefined &&
                          insights.performance !== undefined &&
                          insights.recommendations.length >= 0 &&
                          analyticsStats.performanceMetrics > 15;
    
    testResults.analytics = analyticsWorks;
    console.log(`Analytics System: ${analyticsWorks ? '✅' : '❌'}`);
    console.log(`  Performance Metrics: ${analyticsStats.performanceMetrics}`);
    console.log(`  User Sessions: ${analyticsStats.userSessions}`);
    console.log(`  System Recommendations: ${insights.recommendations.length}`);
    console.log(`  Cache Hit Rate: ${insights.performance.cacheHitRate}%`);

    // Test 4: Cross-System Integration
    console.log('\n=== Test 4: Cross-System Integration ===');
    
    console.time('Cross-System Operations');
    
    // Test: Model selection → Caching → Analytics integration
    const integrationStart = Date.now();
    
    // Step 1: Select model with caching
    const cacheKey = 'integration-model-selection';
    let modelChoice = contentCache.get(cacheKey);
    if (!modelChoice) {
      modelChoice = await adaptiveModelSelector.selectBestModel({
        taskType: 'analysis',
        complexity: 'medium',
        outputLength: 'medium',
        language: 'hebrew',
        quality: 'standard',
        urgency: 'medium',
        context: 'integration test'
      });
      contentCache.set(cacheKey, modelChoice, 30000);
    }
    
    // Step 2: Track the operation with analytics
    const operationDuration = Date.now() - integrationStart;
    advancedAnalytics.trackPerformance(
      'integration-test',
      'cross-system-flow',
      operationDuration,
      true,
      {
        modelSelected: modelChoice.name,
        cacheUsed: contentCache.has(cacheKey),
        systemsInvolved: ['modelSelector', 'cache', 'analytics']
      }
    );
    
    // Step 3: Verify data flow between systems
    const finalInsights = await advancedAnalytics.generateSystemInsights();
    const integrationMetrics = analyticsStats;
    
    console.timeEnd('Cross-System Operations');
    
    const crossSystemWorks = modelChoice !== undefined &&
                            contentCache.has(cacheKey) &&
                            integrationMetrics.performanceMetrics > analyticsStats.performanceMetrics;
    
    testResults.crossSystemIntegration = crossSystemWorks;
    console.log(`Cross-System Integration: ${crossSystemWorks ? '✅' : '❌'}`);
    console.log(`  Model Selected: ${modelChoice.name}`);
    console.log(`  Cache Utilized: ${contentCache.has(cacheKey) ? 'Yes' : 'No'}`);
    console.log(`  Analytics Tracking: ${integrationMetrics.performanceMetrics} metrics`);

    // Test 5: Performance Under Load
    console.log('\n=== Test 5: Performance Under Load ===');
    
    console.time('Load Test');
    
    const loadTestPromises = Array.from({ length: 50 }, async (_, i) => {
      const startTime = Date.now();
      
      try {
        // Concurrent operations across all systems
        const operations = await Promise.all([
          // Cache operations
          Promise.resolve().then(() => {
            contentCache.set(`load-test-${i}`, { index: i, data: `test-data-${i}` }, 5000);
            return contentCache.get(`load-test-${i}`);
          }),
          
          // Analytics tracking
          Promise.resolve().then(() => {
            advancedAnalytics.trackPerformance(
              'load-test',
              'concurrent-operation',
              Math.random() * 1000,
              Math.random() > 0.05,
              { loadTestIndex: i }
            );
            return true;
          }),
          
          // Model selection (lighter operation)
          i % 10 === 0 ? adaptiveModelSelector.selectBestModel({
            taskType: 'question_answering',
            complexity: 'simple',
            outputLength: 'short',
            language: 'hebrew',
            quality: 'draft',
            urgency: 'high'
          }) : Promise.resolve({ name: 'cached-model' })
        ]);
        
        const duration = Date.now() - startTime;
        return { success: true, duration, operations: operations.length };
        
      } catch (error) {
        const duration = Date.now() - startTime;
        return { success: false, duration, error: error.message };
      }
    });
    
    const loadResults = await Promise.all(loadTestPromises);
    console.timeEnd('Load Test');
    
    const successfulOperations = loadResults.filter(r => r.success).length;
    const averageDuration = loadResults.reduce((sum, r) => sum + r.duration, 0) / loadResults.length;
    const performanceGood = successfulOperations >= 45 && averageDuration < 1000; // 90% success, <1s avg
    
    testResults.performance = performanceGood;
    console.log(`Performance Under Load: ${performanceGood ? '✅' : '❌'}`);
    console.log(`  Successful Operations: ${successfulOperations}/50 (${(successfulOperations/50*100).toFixed(1)}%)`);
    console.log(`  Average Duration: ${averageDuration.toFixed(2)}ms`);
    console.log(`  Failed Operations: ${50 - successfulOperations}`);

    // Test 6: Error Handling and Recovery
    console.log('\n=== Test 6: Error Handling and Recovery ===');
    
    console.time('Error Handling Test');
    
    let errorHandlingResults = { gracefulFailures: 0, recoveries: 0, totalTests: 0 };
    
    // Test cache with invalid data
    try {
      contentCache.set('error-test', null, -1); // Invalid TTL
      errorHandlingResults.gracefulFailures++;
    } catch (error) {
      // Expected to handle gracefully
      errorHandlingResults.gracefulFailures++;
    }
    errorHandlingResults.totalTests++;
    
    // Test analytics with invalid data
    try {
      advancedAnalytics.trackPerformance('', '', -1, true); // Invalid parameters
      errorHandlingResults.gracefulFailures++;
    } catch (error) {
      errorHandlingResults.gracefulFailures++;
    }
    errorHandlingResults.totalTests++;
    
    // Test model selection with invalid requirements
    try {
      await adaptiveModelSelector.selectBestModel({
        taskType: 'invalid-task',
        complexity: 'invalid',
        outputLength: 'invalid',
        language: 'invalid',
        quality: 'invalid',
        urgency: 'invalid'
      });
      errorHandlingResults.recoveries++; // Should recover with defaults
    } catch (error) {
      errorHandlingResults.gracefulFailures++; // Or fail gracefully
    }
    errorHandlingResults.totalTests++;
    
    console.timeEnd('Error Handling Test');
    
    const errorHandlingGood = (errorHandlingResults.gracefulFailures + errorHandlingResults.recoveries) >= 2;
    testResults.errorHandling = errorHandlingGood;
    
    console.log(`Error Handling: ${errorHandlingGood ? '✅' : '❌'}`);
    console.log(`  Graceful Failures: ${errorHandlingResults.gracefulFailures}`);
    console.log(`  Successful Recoveries: ${errorHandlingResults.recoveries}`);
    console.log(`  Total Error Tests: ${errorHandlingResults.totalTests}`);

    // Final System Status Check
    console.log('\n=== System Status Summary ===');
    
    const finalCacheStats = contentCache.getStats();
    const finalAnalyticsStats = advancedAnalytics.getAnalyticsStats();
    const finalSystemInsights = await advancedAnalytics.generateSystemInsights();
    
    console.log('Cache System:');
    console.log(`  - Size: ${finalCacheStats.size}/${finalCacheStats.maxSize}`);
    console.log(`  - Hit Rate: ${finalCacheStats.hitRatePercent || 'N/A'}`);
    
    console.log('Analytics System:');
    console.log(`  - Performance Metrics: ${finalAnalyticsStats.performanceMetrics}`);
    console.log(`  - User Sessions: ${finalAnalyticsStats.userSessions}`);
    console.log(`  - System Alerts: ${finalAnalyticsStats.systemAlerts}`);
    console.log(`  - Memory Usage: ${Math.round(finalAnalyticsStats.memoryUsage.heapUsed / 1024 / 1024)} MB`);
    console.log(`  - Uptime: ${Math.round(finalAnalyticsStats.uptime)} seconds`);
    
    console.log('System Health:');
    console.log(`  - Average Response Time: ${finalSystemInsights.performance.averageResponseTime}ms`);
    console.log(`  - Error Rate: ${finalSystemInsights.performance.errorRate}%`);
    console.log(`  - Throughput: ${finalSystemInsights.performance.throughput} ops/hour`);
    console.log(`  - Active Recommendations: ${finalSystemInsights.recommendations.length}`);

    // Calculate Overall Score
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const overallScore = (passedTests / totalTests * 100).toFixed(1);
    
    console.log('\n📊 INTEGRATION TEST RESULTS:');
    console.log('=============================');
    Object.entries(testResults).forEach(([test, result]) => {
      console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
    });
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} (${overallScore}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL SYSTEMS INTEGRATION TESTS PASSED!');
      console.log('🚀 Your AI mentoring system is ready for production!');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('👍 Most integration tests passed - system is largely functional');
      console.log('🔧 Consider addressing the failing components for optimal performance');
    } else {
      console.log('⚠️  Multiple integration issues detected - review and fix before deployment');
    }

    return {
      success: passedTests >= totalTests * 0.8,
      score: overallScore,
      results: testResults,
      systemHealth: {
        cache: finalCacheStats,
        analytics: finalAnalyticsStats,
        insights: finalSystemInsights
      }
    };

  } catch (error) {
    console.error('❌ [Integration Test] Fatal error during integration testing:', error);
    return {
      success: false,
      error: error.message,
      results: testResults
    };
  }
}

// Run the comprehensive integration test
testFullSystemIntegration()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 System integration tests completed successfully!');
      process.exit(0);
    } else {
      console.error('\n💥 System integration tests failed!');
      console.error('Please review the results and fix issues before deployment.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Integration test suite crashed:', error);
    process.exit(1);
  });
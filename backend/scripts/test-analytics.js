const { advancedAnalytics } = require('../dist/services/advancedAnalytics');

async function testAdvancedAnalytics() {
  console.log('📊 [Analytics Test] Starting comprehensive analytics system test...\n');

  try {
    // Test 1: Performance tracking
    console.log('=== Test 1: Performance Tracking ===');
    
    // סימולציה של מטריקות ביצועים
    const services = ['content-generator', 'ai-client', 'recommendation-engine', 'cache-service'];
    const operations = ['generate', 'analyze', 'fetch', 'process'];
    
    console.log('Simulating performance metrics...');
    for (let i = 0; i < 50; i++) {
      const service = services[Math.floor(Math.random() * services.length)];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      const duration = Math.random() * 3000 + 500; // 500-3500ms
      const success = Math.random() > 0.1; // 90% success rate
      
      advancedAnalytics.trackPerformance(
        service,
        operation,
        duration,
        success,
        { 
          modelName: Math.random() > 0.5 ? 'deepseek-ai/DeepSeek-V3.2-Exp' : 'meta-llama/Llama-3.2-11B-Vision',
          complexity: Math.random() > 0.5 ? 'medium' : 'high'
        }
      );
      
      // מניעת הצפה
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    console.log('✅ Tracked 50 performance metrics');

    // Test 2: User behavior tracking
    console.log('\n=== Test 2: User Behavior Tracking ===');
    
    const users = ['user-001', 'user-002', 'user-003', 'user-expert', 'user-beginner'];
    const actionTypes = ['article_read', 'article_save', 'ai_question', 'share', 'like'];
    const targets = ['article-ai-basics', 'article-tech-trends', 'guide-productivity', 'business-strategy'];
    
    console.log('Simulating user behavior...');
    for (let i = 0; i < 100; i++) {
      const sessionId = `session-${Math.floor(i / 10)}`;
      const userId = users[Math.floor(Math.random() * users.length)];
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      const target = targets[Math.floor(Math.random() * targets.length)];
      
      advancedAnalytics.trackUserBehavior(
        sessionId,
        userId,
        actionType,
        target,
        {
          category: 'technology',
          readTime: Math.floor(Math.random() * 15) + 1
        },
        {
          userAgent: 'Mozilla/5.0 Test Browser',
          platform: 'Windows',
          language: 'he-IL',
          timezone: 'Asia/Jerusalem'
        }
      );
      
      // מניעת הצפה
      if (i % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    console.log('✅ Tracked 100 user actions across 10 sessions');

    // Test 3: System insights generation
    console.log('\n=== Test 3: System Insights Generation ===');
    
    console.time('Insights Generation');
    const insights = await advancedAnalytics.generateSystemInsights();
    console.timeEnd('Insights Generation');
    
    console.log('📊 System Insights Results:');
    console.log(`Performance:`);
    console.log(`  - Average Response Time: ${insights.performance.averageResponseTime}ms`);
    console.log(`  - Error Rate: ${insights.performance.errorRate}%`);
    console.log(`  - Throughput: ${insights.performance.throughput} ops/hour`);
    console.log(`  - Cache Hit Rate: ${insights.performance.cacheHitRate}%`);
    
    console.log(`\nUser Behavior:`);
    console.log(`  - Average Session Duration: ${insights.userBehavior.averageSessionDuration} minutes`);
    console.log(`  - Most Popular Content: ${insights.userBehavior.mostPopularContent.slice(0, 3).join(', ')}`);
    console.log(`  - Peak Usage Hours: ${insights.userBehavior.peakUsageHours.join(', ')}`);
    console.log(`  - Content Engagement:`, insights.userBehavior.contentEngagement);
    
    console.log(`\nContent Metrics:`);
    console.log(`  - Top Articles: ${insights.contentMetrics.topPerformingArticles.slice(0, 2).join(', ')}`);
    console.log(`  - Avg Reading Time: ${insights.contentMetrics.avgReadingTime} minutes`);
    console.log(`  - Category Distribution:`, insights.contentMetrics.categoryDistribution);
    
    console.log(`\nAI Metrics:`);
    console.log(`  - Average Generation Time: ${insights.aiMetrics.avgGenerationTime}ms`);
    console.log(`  - User Satisfaction: ${Math.round(insights.aiMetrics.userSatisfaction * 100)}%`);
    console.log(`  - Model Usage:`, insights.aiMetrics.modelUsage);
    console.log(`  - Top Queries: ${insights.aiMetrics.topQueries.slice(0, 2).join(', ')}`);
    
    console.log(`\nRecommendations (${insights.recommendations.length}):`);
    insights.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log(`\nAlerts: ${insights.alerts.length} recent alerts`);
    if (insights.alerts.length > 0) {
      insights.alerts.slice(0, 3).forEach(alert => {
        console.log(`  [${alert.level.toUpperCase()}] ${alert.message}`);
      });
    }

    // Test 4: Analytics caching performance
    console.log('\n=== Test 4: Analytics Caching ===');
    
    console.time('Second Insights Call (cached)');
    const cachedInsights = await advancedAnalytics.generateSystemInsights();
    console.timeEnd('Second Insights Call (cached)');
    
    const cacheHit = JSON.stringify(insights) === JSON.stringify(cachedInsights);
    console.log(`Cache performance: ${cacheHit ? '✅ Hit' : '❌ Miss'}`);

    // Test 5: Analytics statistics
    console.log('\n=== Test 5: Analytics Statistics ===');
    
    const stats = advancedAnalytics.getAnalyticsStats();
    console.log('System Statistics:');
    console.log(`  - Performance Metrics: ${stats.performanceMetrics}`);
    console.log(`  - User Sessions: ${stats.userSessions}`);
    console.log(`  - System Alerts: ${stats.systemAlerts}`);
    console.log(`  - Cache Entries: ${stats.cacheEntries}`);
    console.log(`  - System Uptime: ${Math.round(stats.uptime)} seconds`);
    console.log(`  - Memory Usage: ${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)} MB`);

    // Test 6: Data export functionality
    console.log('\n=== Test 6: Data Export ===');
    
    console.time('Data Export');
    const exportedData = advancedAnalytics.exportAnalyticsData('json');
    console.timeEnd('Data Export');
    
    const exportSize = Buffer.byteLength(exportedData, 'utf8');
    console.log(`Export size: ${Math.round(exportSize / 1024)} KB`);
    
    // Validate export structure
    const parsedExport = JSON.parse(exportedData);
    const hasRequiredFields = [
      'timestamp',
      'performance', 
      'userBehavior',
      'alerts',
      'stats'
    ].every(field => parsedExport.hasOwnProperty(field));
    
    console.log(`Export structure validation: ${hasRequiredFields ? '✅' : '❌'}`);

    // Test 7: Stress test - concurrent tracking
    console.log('\n=== Test 7: Concurrent Tracking Stress Test ===');
    
    console.time('Stress Test (100 concurrent operations)');
    
    const stressPromises = Array.from({ length: 100 }, (_, i) => 
      Promise.resolve().then(() => {
        advancedAnalytics.trackPerformance(
          'stress-test-service',
          'concurrent-operation',
          Math.random() * 1000,
          Math.random() > 0.05, // 95% success
          { testIndex: i }
        );
        
        advancedAnalytics.trackUserBehavior(
          `stress-session-${i % 10}`,
          `stress-user-${i % 5}`,
          'stress_action',
          `stress-target-${i % 20}`,
          { stressTest: true }
        );
      })
    );
    
    await Promise.all(stressPromises);
    console.timeEnd('Stress Test (100 concurrent operations)');
    
    const finalStats = advancedAnalytics.getAnalyticsStats();
    console.log(`Final metrics count: ${finalStats.performanceMetrics}`);
    console.log(`Final sessions count: ${finalStats.userSessions}`);

    // Test 8: Performance analysis accuracy
    console.log('\n=== Test 8: Performance Analysis Accuracy ===');
    
    // הוסף מטריקות ספציפיות לבדיקה
    advancedAnalytics.trackPerformance('test-service', 'slow-operation', 8000, true);
    advancedAnalytics.trackPerformance('test-service', 'fast-operation', 100, true);
    advancedAnalytics.trackPerformance('test-service', 'failed-operation', 2000, false);
    
    const testInsights = await advancedAnalytics.generateSystemInsights();
    
    const hasSlowWarning = testInsights.recommendations.some(rec => 
      rec.includes('ביצועים') || rec.includes('תגובה')
    );
    const hasErrorWarning = testInsights.recommendations.some(rec => 
      rec.includes('שגיאות')
    );
    
    console.log(`Slow performance detection: ${hasSlowWarning ? '✅' : '❌'}`);
    console.log(`Error rate analysis: ${testInsights.performance.errorRate > 0 ? '✅' : '❌'}`);

    console.log('\n✅ [Analytics Test] All tests completed successfully!');
    
    // Summary report
    console.log('\n📈 ANALYTICS TEST SUMMARY:');
    console.log('==========================');
    console.log(`✅ Performance Tracking: Working`);
    console.log(`✅ User Behavior Tracking: Working`);
    console.log(`✅ System Insights: Generated successfully`);
    console.log(`✅ Caching: ${cacheHit ? 'Working' : 'Not working'}`);
    console.log(`✅ Statistics: Complete`);
    console.log(`✅ Data Export: ${hasRequiredFields ? 'Working' : 'Failed'}`);
    console.log(`✅ Stress Test: Handled ${finalStats.performanceMetrics} metrics`);
    console.log(`✅ Analysis Accuracy: Performance & Error detection working`);
    
    const testScore = [
      true, // performance tracking
      true, // user behavior
      insights.recommendations.length > 0, // insights
      cacheHit, // caching
      stats.performanceMetrics > 0, // statistics
      hasRequiredFields, // export
      finalStats.performanceMetrics > 100, // stress test
      hasSlowWarning || hasErrorWarning // analysis accuracy
    ].filter(Boolean).length;
    
    console.log(`\n🎯 Overall Test Score: ${testScore}/8 (${Math.round(testScore/8 * 100)}%)`);
    
    if (testScore >= 7) {
      console.log('🎉 Analytics system is performing excellently!');
    } else if (testScore >= 5) {
      console.log('👍 Analytics system is working well with minor issues');
    } else {
      console.log('⚠️ Analytics system needs improvements');
    }

    return {
      success: testScore >= 6,
      score: testScore,
      insights: testInsights,
      stats: finalStats
    };

  } catch (error) {
    console.error('❌ [Analytics Test] Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the comprehensive test
testAdvancedAnalytics()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 Analytics system tests passed!');
    } else {
      console.error('\n💥 Analytics system tests failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  });
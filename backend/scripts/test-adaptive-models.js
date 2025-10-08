const { adaptiveModelSelector } = require('../dist/services/adaptiveModelSelector');

async function testAdaptiveModelSelection() {
  console.log('🤖 [Model Test] Starting adaptive model selection test...\n');

  // Test scenarios with different requirements
  const testScenarios = [
    {
      name: 'Simple Hebrew Content Generation',
      requirements: {
        taskType: 'content_generation',
        complexity: 'simple',
        outputLength: 'medium',
        language: 'hebrew',
        quality: 'standard',
        urgency: 'medium',
        context: 'basic educational content'
      }
    },
    {
      name: 'Complex Technical Analysis',
      requirements: {
        taskType: 'analysis',
        complexity: 'complex',
        outputLength: 'long',
        language: 'hebrew',
        quality: 'premium',
        urgency: 'low',
        context: 'technical analysis problem solving'
      }
    },
    {
      name: 'Quick Question Answering',
      requirements: {
        taskType: 'question_answering',
        complexity: 'simple',
        outputLength: 'short',
        language: 'hebrew',
        quality: 'draft',
        urgency: 'high',
        context: 'quick user query'
      }
    },
    {
      name: 'Creative Story Writing',
      requirements: {
        taskType: 'creative',
        complexity: 'medium',
        outputLength: 'long',
        language: 'hebrew',
        quality: 'premium',
        urgency: 'low',
        context: 'creative storytelling narrative'
      }
    },
    {
      name: 'Code Generation Task',
      requirements: {
        taskType: 'coding',
        complexity: 'complex',
        outputLength: 'medium',
        language: 'english',
        quality: 'premium',
        urgency: 'medium',
        context: 'technical programming solution'
      }
    }
  ];

  for (const scenario of testScenarios) {
    console.log(`=== ${scenario.name} ===`);
    console.log('Requirements:', scenario.requirements);
    
    try {
      // Test model selection timing
      console.time('Model Selection');
      const recommendation = await adaptiveModelSelector.getModelRecommendation(scenario.requirements);
      console.timeEnd('Model Selection');
      
      console.log('📊 Recommended Model:', recommendation.recommended.name);
      console.log('💪 Strengths:', recommendation.recommended.strengths.join(', '));
      console.log('🎯 Specialties:', recommendation.recommended.specialties.join(', '));
      console.log('⚡ Speed:', recommendation.recommended.speed);
      console.log('🧠 Complexity:', recommendation.recommended.complexity);
      console.log('🌍 Languages:', recommendation.recommended.languages.join(', '));
      
      console.log('🤔 Decision Reasoning:');
      recommendation.reasoning.forEach((reason, index) => {
        console.log(`  ${index + 1}. ${reason}`);
      });
      
      if (recommendation.alternatives.length > 0) {
        console.log('🔄 Alternative Models:');
        recommendation.alternatives.forEach((alt, index) => {
          console.log(`  ${index + 1}. ${alt.name} - ${alt.complexity} complexity, ${alt.speed} speed`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error in model selection:', error.message);
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
  }

  // Test caching behavior
  console.log('=== Cache Performance Test ===');
  
  const cachedScenario = testScenarios[0];
  
  console.time('First Selection (no cache)');
  await adaptiveModelSelector.selectBestModel(cachedScenario.requirements);
  console.timeEnd('First Selection (no cache)');
  
  console.time('Second Selection (with cache)');
  await adaptiveModelSelector.selectBestModel(cachedScenario.requirements);
  console.timeEnd('Second Selection (with cache)');
  
  console.log('\n=== Model Comparison Matrix ===');
  
  // Show how different requirements affect model selection
  const complexityTest = ['simple', 'medium', 'complex'];
  const urgencyTest = ['low', 'medium', 'high'];
  
  console.log('\nComplexity Impact:');
  for (const complexity of complexityTest) {
    const testReq = {
      taskType: 'content_generation',
      complexity: complexity,
      outputLength: 'medium',
      language: 'hebrew',
      quality: 'standard',
      urgency: 'medium'
    };
    
    const result = await adaptiveModelSelector.selectBestModel(testReq);
    console.log(`${complexity.padEnd(10)}: ${result.name} (${result.complexity} model)`);
  }
  
  console.log('\nUrgency Impact:');
  for (const urgency of urgencyTest) {
    const testReq = {
      taskType: 'question_answering',
      complexity: 'simple',
      outputLength: 'short',
      language: 'hebrew',
      quality: 'standard',
      urgency: urgency
    };
    
    const result = await adaptiveModelSelector.selectBestModel(testReq);
    console.log(`${urgency.padEnd(10)}: ${result.name} (${result.speed} model)`);
  }
  
  console.log('\n✅ [Model Test] Adaptive model selection test completed successfully!');
}

// Run the test
testAdaptiveModelSelection().catch(console.error);
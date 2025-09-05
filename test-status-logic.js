// Test the new status logic
function testStatusLogic() {
  console.log('🧪 Testing Status Column Logic\n');
  
  const testCases = [
    { value: '', expected: true, description: 'Empty string' },
    { value: null, expected: true, description: 'Null value' },
    { value: undefined, expected: true, description: 'Undefined value' },
    { value: '   ', expected: true, description: 'Whitespace only' },
    { value: 'active', expected: true, description: 'Active (lowercase)' },
    { value: 'ACTIVE', expected: true, description: 'Active (uppercase)' },
    { value: 'true', expected: true, description: 'True' },
    { value: '1', expected: true, description: 'Number 1' },
    { value: 'yes', expected: true, description: 'Yes' },
    { value: 'inactive', expected: false, description: 'Inactive (lowercase)' },
    { value: 'INACTIVE', expected: false, description: 'Inactive (uppercase)' },
    { value: 'Inactive', expected: false, description: 'Inactive (mixed case)' },
    { value: 'false', expected: true, description: 'False (should be active - only "inactive" makes it inactive)' },
    { value: '0', expected: true, description: 'Zero (should be active - only "inactive" makes it inactive)' }
  ];
  
  console.log('📋 Test Results:');
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    // Apply the new logic: default to active unless explicitly "inactive"
    const result = !testCase.value || testCase.value.trim() === '' || testCase.value?.toLowerCase() !== 'inactive';
    
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${testCase.description}: "${testCase.value}" → ${result} (expected: ${testCase.expected}) ${status}`);
    
    if (result === testCase.expected) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The logic correctly handles:');
    console.log('   ✅ Empty/null/undefined values → ACTIVE');
    console.log('   ✅ Any value except "inactive" → ACTIVE');
    console.log('   ✅ Only "inactive" (case-insensitive) → INACTIVE');
  } else {
    console.log('⚠️  Some tests failed - review the logic');
  }
}

testStatusLogic();


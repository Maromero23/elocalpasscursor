const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSavedConfiguration() {
  try {
    console.log('🧪 Testing Saved Configuration System...\n');
    
    // Test 1: Create a saved configuration
    console.log('1. Creating a sample saved configuration...');
    const sampleConfig = {
      button1GuestsLocked: false,
      button1GuestsDefault: 4,
      button1GuestsRangeMax: 12,
      button1DaysLocked: true,
      button1DaysDefault: 7,
      button1DaysRangeMax: 7,
      button2PricingType: 'VARIABLE',
      button2FixedPrice: 30,
      button2VariableBasePrice: 15,
      button2VariableGuestIncrease: 8,
      button2VariableDayIncrease: 5,
      button2VariableCommission: 10,
      button2IncludeTax: true,
      button2TaxPercentage: 16,
      button3DeliveryMethod: 'BOTH'
    };
    
    const savedConfig = await prisma.savedQRConfiguration.create({
      data: {
        name: 'Test Premium Package',
        description: 'High-end vacation package with variable pricing',
        config: JSON.stringify(sampleConfig)
      }
    });
    
    console.log('✅ Saved configuration created:', {
      id: savedConfig.id,
      name: savedConfig.name
    });
    
    // Test 2: Find Pedrita Gomez and assign the new configuration
    console.log('\n2. Finding Pedrita Gomez...');
    const pedrita = await prisma.user.findFirst({
      where: {
        name: { contains: 'Pedrita' },
        role: 'SELLER'
      }
    });
    
    if (pedrita) {
      console.log('✅ Found Pedrita:', pedrita.email);
      
      // Assign the saved configuration to Pedrita
      console.log('\n3. Assigning saved configuration to Pedrita...');
      await prisma.user.update({
        where: { id: pedrita.id },
        data: { 
          savedConfigId: savedConfig.id,
          // Keep legacy fields for display in admin
          configurationName: savedConfig.name
        }
      });
      
      console.log('✅ Configuration assigned to Pedrita');
      
      // Test 3: Verify the assignment
      console.log('\n4. Verifying assignment...');
      const updatedPedrita = await prisma.user.findUnique({
        where: { id: pedrita.id },
        include: { savedConfig: true }
      });
      
      if (updatedPedrita?.savedConfig) {
        console.log('✅ Assignment verified:', {
          seller: updatedPedrita.name,
          configName: updatedPedrita.savedConfig.name,
          configId: updatedPedrita.savedConfig.id
        });
        
        // Parse and display the configuration
        const config = JSON.parse(updatedPedrita.savedConfig.config);
        console.log('📋 Configuration details:', {
          guests: `${config.button1GuestsLocked ? 'Fixed' : 'Flexible'}: ${config.button1GuestsDefault} (max: ${config.button1GuestsRangeMax})`,
          days: `${config.button1DaysLocked ? 'Fixed' : 'Flexible'}: ${config.button1DaysDefault} (max: ${config.button1DaysRangeMax})`,
          pricing: config.button2PricingType,
          delivery: config.button3DeliveryMethod
        });
      } else {
        console.log('❌ Assignment verification failed');
      }
    } else {
      console.log('❌ Pedrita Gomez not found');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSavedConfiguration();

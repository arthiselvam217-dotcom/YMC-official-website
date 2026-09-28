const models = require('./src/models');
const { sendEmail, isSmtpConfigured } = require('./src/config/mailer');

console.log('Testing Mongoose Models and Configurations:');
const expectedModels = [
  'User',
  'MemberApplication',
  'BloodDonor',
  'BloodRequest',
  'Event',
  'EventRegistration',
  'LibraryResource',
  'ElectiveResource',
  'StudentWork',
  'Podcast',
  'TdcTalk',
  'UsageCounter',
];

let allPassed = true;
for (const modelName of expectedModels) {
  if (models[modelName] && models[modelName].modelName === modelName) {
    console.log(`  [PASS] Model ${modelName} loaded properly.`);
  } else {
    console.error(`  [FAIL] Model ${modelName} failed to load.`);
    allPassed = false;
  }
}

console.log(`\nMailer Configuration Check:`);
console.log(`  SMTP Configured: ${isSmtpConfigured() ? 'Yes' : 'No (Mock Mode)'}`);

if (allPassed) {
  console.log('\nAll 12 Mongoose Models and Configurations passed verification successfully!');
  process.exit(0);
} else {
  console.error('\nSome models failed verification.');
  process.exit(1);
}

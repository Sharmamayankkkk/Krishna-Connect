const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('VAPID Keys Generated');
console.log('=======================================');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key:');
console.log(vapidKeys.privateKey);
console.log('=======================================');
console.log('Add these to your .env.local file:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('=======================================');

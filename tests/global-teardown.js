async function globalTeardown() {
  console.log('\n🧹 Cleaning up MongoDB Memory Server...');

  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
    console.log('MongoDB Memory Server stopped\n');
  }
}

export default globalTeardown;

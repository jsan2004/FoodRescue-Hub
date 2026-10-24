const db = require('../config/database');

async function viewDatabase() {
  await db.init();
  const args = process.argv.slice(2);
  const targetTable = args[0];

  const tables = [
    'users',
    'ngos',
    'volunteers',
    'donations',
    'donation_assignments',
    'activity_logs',
    'evaluation_records'
  ];

  if (!targetTable || targetTable === 'summary') {
    console.log('\n====================================================');
    console.log('       FOOD DONATION DATABASE OVERVIEW');
    console.log('====================================================');
    for (const tbl of tables) {
      const countRes = db.prepare(`SELECT COUNT(*) AS total FROM ${tbl}`).get();
      console.log(` • Table: ${tbl.padEnd(24)} | Total Rows: ${countRes.total}`);
    }
    console.log('====================================================');
    console.log('💡 Tip: To view records of a specific table, run:');
    console.log('   npm run view-db <table_name>');
    console.log('   Example: npm run view-db donations');
    console.log('   Example: npm run view-db users');
    console.log('====================================================\n');
    return;
  }

  if (!tables.includes(targetTable)) {
    console.log(`\n❌ Unknown table: "${targetTable}". Available tables:`);
    console.log(tables.map(t => ` - ${t}`).join('\n'));
    console.log();
    return;
  }

  const rows = db.prepare(`SELECT * FROM ${targetTable} ORDER BY id DESC LIMIT 20`).all();
  console.log(`\n====================================================`);
  console.log(` Showing latest records from "${targetTable}" (up to 20 rows):`);
  console.log(`====================================================`);
  if (rows.length === 0) {
    console.log('(Table is currently empty)');
  } else {
    console.table(rows);
  }
  console.log('====================================================\n');
}

viewDatabase().catch(err => console.error(err));

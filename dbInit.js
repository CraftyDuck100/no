const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const CurrencyShop = sequelize.import('models/CurrencyShop');
sequelize.import('models/Users');
sequelize.import('models/UserItems');
sequelize.import('models/Kingdom');
sequelize.import('models/Stats');

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const shop = [
    CurrencyShop.upsert({ name: 'Castle', cost: 5 }),
    CurrencyShop.upsert({ name: 'Tower', cost: 3 }),
    CurrencyShop.upsert({ name: 'LootFactory', cost: 10 }),
	];
	await Promise.all(shop);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);
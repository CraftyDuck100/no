const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = sequelize.import('models/Users');
const CurrencyShop = sequelize.import('models/CurrencyShop');
const UserItems = sequelize.import('models/UserItems');
const Kingdom = sequelize.import('models/Kingdom');
const Stats = sequelize.import('models/Stats');

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });
Kingdom.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });
Kingdom.belongsTo(CurrencyShop, { foreignKey: 'X', as: 'x' });
Kingdom.belongsTo(CurrencyShop, { foreignKey: 'Y', as: 'y' });
Kingdom.belongsTo(CurrencyShop, { foreignKey: 'Level', as: 'lvl' });

Users.prototype.addItem = async function(item) {
	const userItem = await UserItems.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});
	if (userItem) {
		userItem.amount += 1;
		return userItem.save();
	}
  if (item.id <= 3) {
    return Kingdom.create({ user_id: this.user_id, item_id: item.id, amount: 1, Level: 1, X: 4, Y: 4 });
  } else {
    return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: 1 });
  }
};

Users.prototype.getItems = function() {
	return UserItems.findAll({
		where: { user_id: this.user_id },
		include: ['item'],
	});
};

Users.prototype.getKingdom = function() {
	return Kingdom.findAll({
		where: { user_id: this.user_id },
		include: ['item', 'x', 'y', 'lvl'],
	});
};

Kingdom.prototype.setCCoords = async function(item, X, Y) {
  const buildingStats = await Kingdom.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});
  buildingStats.X = X;
  buildingStats.Y = Y;
	return buildingStats.save();
};
Kingdom.prototype.upgrade = async function(item) {
  const buildingLevel = await Kingdom.findOne({
		where: { user_id: this.user_id, item_id: item.id },
	});
  buildingLevel.Level += 1;
	return buildingLevel.save();
};

module.exports = { Users, CurrencyShop, UserItems, Kingdom };
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('cards', {
		user_id: DataTypes.STRING,
		card_id: DataTypes.STRING,
		rank: DataTypes.STRING,
		lvl: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
	}, {
		timestamps: false,
	});
};
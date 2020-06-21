module.exports = (sequelize, DataTypes) => {
	return sequelize.define('kingdom', {
		user_id: DataTypes.STRING,
		item_id: DataTypes.STRING,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
    Level: {
      type: DataTypes.INTEGER,
      allowNull:false,
      'default': 1,
    },
    X: {
      type: DataTypes.INTEGER,
      allowNull:false,
      'default': 4,
    },
    Y: {
      type: DataTypes.INTEGER,
      allowNull:false,
      'default': 4,
    },
    
	}, {
		timestamps: false,
	});
};
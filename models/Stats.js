module.exports = (sequelize, DataTypes) => {
	return sequelize.define('stats', {
		user_id: DataTypes.STRING,
		Backround: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 1,
		},
    Level: {
      type: DataTypes.INTEGER,
      allowNull:false,
      'default': 1,
    },
    Exp: {
      type: DataTypes.INTEGER,
      allowNull:false,
      'default': 0,
    },
    
	}, {
		timestamps: false,
	});
};
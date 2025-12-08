import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Workspace = sequelize.define(
  'Workspace',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'workspaces',
    timestamps: true,
  }
);

export default Workspace;
